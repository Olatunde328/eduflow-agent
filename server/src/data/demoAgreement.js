export const demoAgreement = {
  id: "agr_demo_math_001",
  title: "Mathematics Improvement Programme",
  subject: "Mathematics",
  payer: {
    name: "Demo Parent",
    walletAddress: "0x1111111111111111111111111111111111111111"
  },
  provider: {
    name: "Demo Mathematics Tutor",
    walletAddress: "0x2222222222222222222222222222222222222222"
  },
  currency: "USDC",
  totalBudget: 30,
  amountPaid: 0,
  remainingBudget: 30,
  amountPerMilestone: 10,
  autoPayLimit: 10,
  minimumDurationMinutes: 45,
  minimumAssessmentScore: 60,
  requiresLearnerConfirmation: true,
  status: "ACTIVE",
  expiresAt: "2026-08-10T23:59:59.000Z",
  milestones: [
    {
      id: "lesson_001",
      title: "Algebra Fundamentals",
      sequence: 1,
      status: "PENDING",
      paid: false
    },
    {
      id: "lesson_002",
      title: "Linear Equations",
      sequence: 2,
      status: "PENDING",
      paid: false
    },
    {
      id: "lesson_003",
      title: "Word Problems",
      sequence: 3,
      status: "PENDING",
      paid: false
    }
  ]
};
