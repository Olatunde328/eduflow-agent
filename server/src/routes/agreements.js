import { Router } from "express";
import { z } from "zod";
import { demoAgreement } from "../data/demoAgreement.js";
import { evaluateLearningMilestone } from "../services/policyEngine.js";

const router = Router();

const evidenceSchema = z.object({
  milestoneId: z.string().min(1),
  durationMinutes: z.coerce.number().nonnegative(),
  learnerConfirmed: z.boolean(),
  assessmentScore: z.coerce.number().min(0).max(100),
  requestedAmount: z.coerce.number().positive(),
  tutorStatement: z.string().max(1000).optional().default("")
});

router.get("/demo", (req, res) => {
  res.json({
    success: true,
    agreement: demoAgreement
  });
});

router.post("/demo/evaluate", (req, res) => {
  const parsed = evidenceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid evidence payload",
      details: parsed.error.flatten()
    });
  }

  const evidence = parsed.data;
  const milestone = demoAgreement.milestones.find(
    (item) => item.id === evidence.milestoneId
  );

  const decision = evaluateLearningMilestone({
    agreement: demoAgreement,
    milestone,
    evidence
  });

  return res.json({
    success: true,
    agreementId: demoAgreement.id,
    milestoneId: evidence.milestoneId,
    evidence,
    decision,
    createdAt: new Date().toISOString()
  });
});

export default router;
