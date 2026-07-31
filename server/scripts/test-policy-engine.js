import assert from "node:assert/strict";
import { demoAgreement } from "../src/data/demoAgreement.js";
import {
  DECISIONS,
  evaluateLearningMilestone,
} from "../src/services/policyEngine.js";

const milestone = demoAgreement.milestones[0];

const payDecision = evaluateLearningMilestone({
  agreement: demoAgreement,
  milestone,
  evidence: {
    milestoneId: milestone.id,
    durationMinutes: 55,
    learnerConfirmed: true,
    assessmentScore: 82,
    requestedAmount: 10,
    tutorStatement: "Lesson completed successfully.",
  },
});

assert.equal(
  payDecision.decision,
  DECISIONS.PAY,
);

const holdDecision = evaluateLearningMilestone({
  agreement: demoAgreement,
  milestone,
  evidence: {
    milestoneId: milestone.id,
    durationMinutes: 20,
    learnerConfirmed: false,
    assessmentScore: 80,
    requestedAmount: 10,
    tutorStatement: "",
  },
});

assert.equal(
  holdDecision.decision,
  DECISIONS.HOLD,
);

const rejectDecision =
  evaluateLearningMilestone({
    agreement: demoAgreement,
    milestone,
    evidence: {
      milestoneId: milestone.id,
      durationMinutes: 55,
      learnerConfirmed: true,
      assessmentScore: 82,
      requestedAmount: 11,
      tutorStatement: "",
    },
  });

assert.equal(
  rejectDecision.decision,
  DECISIONS.REJECT,
);

console.log("Policy tests passed: PAY, HOLD and REJECT.");