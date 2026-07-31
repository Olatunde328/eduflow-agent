export const DECISIONS = Object.freeze({
  PAY: "PAY",
  HOLD: "HOLD",
  ESCALATE: "ESCALATE",
  REJECT: "REJECT",
});

function createCheck(rule, passed, observed, required, reason) {
  return {
    rule,
    passed,
    observed,
    required,
    reason,
  };
}

function result(decision, authorizedAmount, checks, explanation) {
  return {
    decision,
    authorizedAmount,
    checks,
    explanation,
    evaluator: "deterministic-policy-engine-v1",
  };
}

export function evaluateLearningMilestone({
  agreement,
  milestone,
  evidence,
}) {
  const checks = [];

  if (agreement.status !== "ACTIVE") {
    return result(
      DECISIONS.REJECT,
      0,
      [
        createCheck(
          "agreementStatus",
          false,
          agreement.status,
          "ACTIVE",
          "The learning agreement is not active.",
        ),
      ],
      "Payment rejected because the agreement is not active.",
    );
  }

  const now = new Date();
  const expiresAt = new Date(agreement.expiresAt);

  if (Number.isNaN(expiresAt.getTime()) || now > expiresAt) {
    return result(
      DECISIONS.REJECT,
      0,
      [
        createCheck(
          "agreementExpiry",
          false,
          now.toISOString(),
          agreement.expiresAt,
          "The learning agreement has expired.",
        ),
      ],
      "Payment rejected because the agreement has expired.",
    );
  }

  if (!milestone) {
    return result(
      DECISIONS.REJECT,
      0,
      [
        createCheck(
          "milestoneExists",
          false,
          "Not found",
          "Existing milestone",
          "The supplied milestone does not exist.",
        ),
      ],
      "Payment rejected because the milestone was not found.",
    );
  }

  if (milestone.paid || milestone.status === "PAID") {
    return result(
      DECISIONS.REJECT,
      0,
      [
        createCheck(
          "duplicatePayment",
          false,
          "Already paid",
          "Unpaid milestone",
          "Duplicate milestone payments are not permitted.",
        ),
      ],
      "Payment rejected because this milestone has already been paid.",
    );
  }

  if (milestone.status === "PROCESSING") {
    return result(
      DECISIONS.HOLD,
      0,
      [
        createCheck(
          "paymentInProgress",
          false,
          "PROCESSING",
          "PENDING",
          "A payment transaction is already being processed.",
        ),
      ],
      "Payment is on hold while the existing transaction is processed.",
    );
  }

  const requestedAmount = Number(evidence.requestedAmount);
  const duration = Number(evidence.durationMinutes);
  const assessmentScore = Number(evidence.assessmentScore);

  const durationPassed =
    duration >= agreement.minimumDurationMinutes;

  const learnerConfirmationPassed =
    !agreement.requiresLearnerConfirmation ||
    evidence.learnerConfirmed === true;

  const assessmentPassed =
    assessmentScore >= agreement.minimumAssessmentScore;

  const milestoneAmountPassed =
    requestedAmount <= agreement.amountPerMilestone;

  const autoPayPassed =
    requestedAmount <= agreement.autoPayLimit;

  const budgetPassed =
    requestedAmount <= agreement.remainingBudget;

  checks.push(
    createCheck(
      "minimumDuration",
      durationPassed,
      `${duration} minutes`,
      `${agreement.minimumDurationMinutes} minutes`,
      durationPassed
        ? "The lesson duration requirement was satisfied."
        : "The lesson duration is below the required minimum.",
    ),
    createCheck(
      "learnerConfirmation",
      learnerConfirmationPassed,
      evidence.learnerConfirmed ? "Confirmed" : "Not confirmed",
      agreement.requiresLearnerConfirmation
        ? "Required"
        : "Optional",
      learnerConfirmationPassed
        ? "The learner confirmation requirement was satisfied."
        : "Learner confirmation is still required.",
    ),
    createCheck(
      "assessmentScore",
      assessmentPassed,
      `${assessmentScore}%`,
      `${agreement.minimumAssessmentScore}%`,
      assessmentPassed
        ? "The assessment threshold was satisfied."
        : "The assessment score is below the required threshold.",
    ),
    createCheck(
      "milestoneAmount",
      milestoneAmountPassed,
      `${requestedAmount} USDC`,
      `Maximum ${agreement.amountPerMilestone} USDC`,
      milestoneAmountPassed
        ? "The request is within the milestone payment limit."
        : "The request exceeds the milestone payment limit.",
    ),
    createCheck(
      "autoPayLimit",
      autoPayPassed,
      `${requestedAmount} USDC`,
      `Maximum ${agreement.autoPayLimit} USDC`,
      autoPayPassed
        ? "The request is within the agent's automatic authority."
        : "The request requires human approval.",
    ),
    createCheck(
      "remainingBudget",
      budgetPassed,
      `${requestedAmount} USDC requested`,
      `${agreement.remainingBudget} USDC remaining`,
      budgetPassed
        ? "The agreement has sufficient remaining budget."
        : "The request exceeds the remaining agreement budget.",
    ),
  );

  if (!milestoneAmountPassed || !budgetPassed) {
    return result(
      DECISIONS.REJECT,
      0,
      checks,
      "Payment rejected because the requested amount violates the authorized spending policy.",
    );
  }

  if (!durationPassed || !learnerConfirmationPassed) {
    return result(
      DECISIONS.HOLD,
      0,
      checks,
      "Payment is on hold because required lesson evidence is incomplete.",
    );
  }

  if (!assessmentPassed || !autoPayPassed) {
    return result(
      DECISIONS.ESCALATE,
      0,
      checks,
      !assessmentPassed
        ? "Human review is required because the learning outcome threshold was not satisfied."
        : "Human approval is required because the amount exceeds the agent's automatic authority.",
    );
  }

  return result(
    DECISIONS.PAY,
    requestedAmount,
    checks,
    "All learning evidence and spending-policy conditions were satisfied.",
  );
}