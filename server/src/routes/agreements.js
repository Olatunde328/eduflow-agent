import { hydrateAgreementFromArc } from "../services/arcAgreementStateService.js";
import { Router } from "express";
import { z } from "zod";
import {
  demoAgreement,
  getPublicAgreement,
} from "../data/demoAgreement.js";
import {
  DECISIONS,
  evaluateLearningMilestone,
} from "../services/policyEngine.js";
import {
  executeMilestonePayment,
  getCircleTransaction,
} from "../services/circlePaymentService.js";

const router = Router();
const activeExecutions = new Map();

const evidenceSchema = z.object({
  milestoneId: z.string().trim().min(1).max(100),
  durationMinutes: z.coerce.number().nonnegative(),
  learnerConfirmed: z.boolean(),
  assessmentScore: z.coerce.number().min(0).max(100),
  requestedAmount: z.coerce.number().positive().max(10),
  tutorStatement: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .default(""),
});

function findMilestone(milestoneId) {
  return demoAgreement.milestones.find(
    (milestone) => milestone.id === milestoneId,
  );
}

function evaluatePayload(payload) {
  const milestone = findMilestone(payload.milestoneId);

  const decision = evaluateLearningMilestone({
    agreement: demoAgreement,
    milestone,
    evidence: payload,
  });

  return {
    milestone,
    decision,
  };
}

async function hydrateAgreementAfterSettlement(
  paidMilestoneId,
) {
  let lastAgreement = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      lastAgreement =
        await hydrateAgreementFromArc(
          demoAgreement,
        );

      const paidMilestone =
        lastAgreement.milestones.find(
          (milestone) =>
            milestone.id === paidMilestoneId,
        );

      if (paidMilestone?.paid) {
        return lastAgreement;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 750),
    );
  }

  if (lastAgreement) {
    return lastAgreement;
  }

  throw (
    lastError ??
    new Error(
      "Arc state could not be synchronized after settlement.",
    )
  );
}

router.get("/demo", async (req, res, next) => {
  try {
    const agreement =
      await hydrateAgreementFromArc(
        demoAgreement,
      );

    return res.json({
      success: true,
      agreement,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/demo/evaluate", (req, res) => {
  const parsed = evidenceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid evidence payload",
      details: parsed.error.flatten(),
    });
  }

  const evidence = parsed.data;
  const { decision } = evaluatePayload(evidence);

  return res.json({
    success: true,
    mode: "EVALUATION_ONLY",
    agreementId: demoAgreement.id,
    onchainAgreementId:
      demoAgreement.onchainAgreementId,
    milestoneId: evidence.milestoneId,
    evidence,
    decision,
    paymentSubmitted: false,
    createdAt: new Date().toISOString(),
  });
});

router.post("/demo/execute", async (req, res, next) => {
  try {
    const parsed = evidenceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid evidence payload",
        details: parsed.error.flatten(),
      });
    }

    const evidence = parsed.data;
    const { milestone, decision } =
      evaluatePayload(evidence);

    if (decision.decision !== DECISIONS.PAY) {
      return res.status(200).json({
        success: true,
        mode: "POLICY_DECISION",
        agreementId: demoAgreement.id,
        onchainAgreementId:
          demoAgreement.onchainAgreementId,
        milestoneId: evidence.milestoneId,
        evidence,
        decision,
        paymentSubmitted: false,
        transaction: null,
        createdAt: new Date().toISOString(),
      });
    }

    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: "Milestone not found.",
      });
    }

    if (activeExecutions.has(milestone.id)) {
      return res.status(409).json({
        success: false,
        error:
          "A payment execution is already active for this milestone.",
        transaction:
          activeExecutions.get(milestone.id),
      });
    }

    milestone.status = "PROCESSING";

    const pendingRecord = {
      milestoneId: milestone.id,
      state: "SUBMITTING",
      startedAt: new Date().toISOString(),
    };

    activeExecutions.set(
      milestone.id,
      pendingRecord,
    );

    try {
      const transaction =
        await executeMilestonePayment({
          agreementId:
            demoAgreement.onchainAgreementId,
          milestoneId: milestone.id,
          amount: decision.authorizedAmount,
          evidence,
        });

      activeExecutions.set(
        milestone.id,
        transaction,
      );

      milestone.transactionId =
        transaction.transactionId;

      milestone.transactionHash =
        transaction.transactionHash;

      if (transaction.successful) {
        milestone.status = "PAID";
        milestone.paid = true;

        demoAgreement.amountPaid +=
          decision.authorizedAmount;

        demoAgreement.remainingBudget -=
          decision.authorizedAmount;
      } else if (
        ["FAILED", "DENIED", "CANCELLED"].includes(
          transaction.state,
        )
      ) {
        milestone.status = "PENDING";
        activeExecutions.delete(milestone.id);
      }

      return res.status(202).json({
        success: true,
        mode: "LIVE_CIRCLE_EXECUTION",
        agreementId: demoAgreement.id,
        onchainAgreementId:
          demoAgreement.onchainAgreementId,
        milestoneId: milestone.id,
        evidence,
        decision,
        paymentSubmitted: true,
        transaction,
        agreement: await hydrateAgreementAfterSettlement(milestone.id),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      milestone.status = "PENDING";
      activeExecutions.delete(milestone.id);
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.get(
  "/transactions/:transactionId",
  async (req, res, next) => {
    try {
      const transaction =
        await getCircleTransaction(
          req.params.transactionId,
        );

      return res.json({
        success: true,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;