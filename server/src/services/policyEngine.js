const DECISIONS = {
  PAY: "PAY",
  HOLD: "HOLD",
  ESCALATE: "ESCALATE",
  REJECT: "REJECT"
};

function createCheck(rule, passed, observed, required, reason) {
  return {
    rule,
    passed,
    observed,
    required,
    reason
  };
}

export function evaluateLearningMilestone({ agreement, milestone, evidence }) {
  const checks = [];

  if (agreement.status !== "ACTIVE") {
    return {
      decision: DECISIONS.REJECT,
      authorizedAmount: 0,
      checks: [
        createCheck(
          "agreementStatus",
          false,
          agreement.status,
          "ACTIVE",
          "The learning agreement is not active."
        )
      ],
      explanation: "Payment rejected because the agreement is not active.",
      evaluator: "deterministic-rules-engine"
    };
  }

  const now = new Date();
  const expiresAt = new Date(agreement.expiresAt);

  if (now > expiresAt) {
    return {
      decision: DECISIONS.REJECT,
      authorizedAmount: 0,
      checks: [
        createCheck(
          "agreementExpiry",
          false,
          now.toISOString(),
          agreement.expiresAt,
          "The agreement has expired."
        )
      ],
      explanation: "Payment rejected because the agreement has expired.",
      evaluator: "deterministic-rules-engine"
    };
  }

  if (!milestone) {
    return {
      decision: DECISIONS.REJECT,
      authorizedAmount: 0,
      checks: [
        createCheck(
          "milestoneExists",
          false,
          "Not found",
          "Valid milestone",
          "The supplied milestone does not exist."
        )
      ],
      explanation: "Payment rejected because the milestone was not found.",
      evaluator: "deterministic-rules-engine"
    };
  }

  if (milestone.paid) {
    return {
      decision: DECISIONS.REJECT,
      authorizedAmount: 0,
      checks: [
        createCheck(
          "duplicatePayment",
          false,
          "Already paid",
          "Unpaid milestone",
          "This milestone has already been paid."
        )
      ],
      explanation: "Payment rejected because duplicate milestone payments are not allowed.",
      evaluator: "deterministic-rules-engine"
    };
  }

  const requestedAmount = Number(evidence.requestedAmount);

  checks.push(
    createCheck(
      "minimumDuration",
      Number(evidence.durationMinutes) >= agreement.minimumDurationMinutes,
      `${evidence.durationMinutes} minutes`,
      `${agreement.minimumDurationMinutes} minutes`,
      Number(evidence.durationMinutes) >= agreement.minimumDurationMinutes
        ? "The lesson duration requirement was satisfied."
        : "The lesson duration is below the required minimum."
    )
  );

  checks.push(
    createCheck(
      "learnerConfirmation",
      agreement.requiresLearnerConfirmation
        ? evidence.learnerConfirmed === true
        : true,
      evidence.learnerConfirmed ? "Confirmed" : "Not confirmed",
      agreement.requiresLearnerConfirmation ? "Required" : "Optional",
      !agreement.requiresLearnerConfirmation || evidence.learnerConfirmed
        ? "The learner confirmation requirement was satisfied."
        : "Learner confirmation is still required."
    )
  );

  checks.push(
    createCheck(
      "assessmentScore",
      Number(evidence.assessmentScore) >= agreement.minimumAssessmentScore,
      `${evidence.assessmentScore}%`,
      `${agreement.minimumAssessmentScore}%`,
      Number(evidence.assessmentScore) >= agreement.minimumAssessmentScore
        ? "The assessment threshold was satisfied."
        : "The assessment score is below the required threshold."
    )
  );

  checks.push(
    createCheck(
      "milestoneAmount",
      requestedAmount <= agreement.amountPerMilestone,
      `${requestedAmount} USDC`,
      `Maximum ${agreement.amountPerMilestone} USDC`,
      requestedAmount <= agreement.amountPerMilestone
        ? "The requested amount is within the milestone limit."
        : "The requested amount exceeds the milestone limit."
    )
  );

  checks.push(
    createCheck(
      "autoPayLimit",
      requestedAmount <= agreement.autoPayLimit,
      `${requestedAmount} USDC`,
      `Maximum ${agreement.autoPayLimit} USDC`,
      requestedAmount <= agreement.autoPayLimit
        ? "The requested amount is within the automatic payment limit."
        : "The request exceeds the agent's automatic payment authority."
    )
  );

  checks.push(
    createCheck(
      "remainingBudget",
      requestedAmount <= agreement.remainingBudget,
      `${requestedAmount} USDC requested`,
      `${agreement.remainingBudget} USDC remaining`,
      requestedAmount <= agreement.remainingBudget
        ? "The agreement has enough remaining budget."
        : "The request exceeds the remaining agreement budget."
    )
  );

  const amountViolation =
    requestedAmount > agreement.amountPerMilestone ||
    requestedAmount > agreement.remainingBudget;

  if (amountViolation) {
    return {
      decision: DECISIONS.REJECT,
      authorizedAmount: 0,
      checks,
      explanation:
        "Payment rejected because the requested amount violates the authorized spending policy.",
      evaluator: "deterministic-rules-engine"
    };
  }

  if (requestedAmount > agreement.autoPayLimit) {
    return {
      decision: DECISIONS.ESCALATE,
      authorizedAmount: 0,
      checks,
      explanation:
        "Human approval is required because the requested amount exceeds the agent's automatic payment authority.",
      evaluator: "deterministic-rules-engine"
    };
  }

  const missingEvidence =
    !evidence.learnerConfirmed ||
    Number(evidence.durationMinutes) < agreement.minimumDurationMinutes;

  if (missingEvidence) {
    return {
      decision: DECISIONS.HOLD,
      authorizedAmount: 0,
      checks,
      explanation:
        "Payment is on hold because required lesson evidence is incomplete.",
      evaluator: "deterministic-rules-engine"
    };
  }

  if (Number(evidence.assessmentScore) < agreement.minimumAssessmentScore) {
    return {
      decision: DECISIONS.ESCALATE,
      authorizedAmount: 0,
      checks,
      explanation:
        "Human review is required because the learning outcome threshold was not satisfied.",
      evaluator: "deterministic-rules-engine"
    };
  }

  return {
    decision: DECISIONS.PAY,
    authorizedAmount: requestedAmount,
    checks,
    explanation:
      "All learning evidence and spending-policy conditions were satisfied.",
    evaluator: "deterministic-rules-engine"
  };
}
