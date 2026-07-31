export const demoAgreement = {
  id: "agr_demo_math_001",
  onchainAgreementId: 1,
  title: "Mathematics Improvement Programme",
  subject: "Mathematics",

  payer: {
    name: "Demo Parent",
    walletAddress:
      process.env.EDUFLOW_PAYER_ADDRESS ??
      "0x5A373041F989348753e37C1BC5a69971604F49d3",
  },

  provider: {
    name: "Demo Mathematics Tutor",
    walletAddress:
      process.env.CIRCLE_PROVIDER_ADDRESS ??
      "0x28A2543f6c92419D9955f18de7c80147e24483e9",
  },

  currency: "USDC",
  totalBudget: 30,
  amountPerMilestone: 10,
  amountPaid: 0,
  remainingBudget: 30,
  autoPayLimit: 10,

  minimumDurationMinutes: 45,
  minimumAssessmentScore: 60,
  requiresLearnerConfirmation: true,

  status: "ACTIVE",
  expiresAt: "2026-08-30T23:59:59.000Z",

  network: {
    name: "Arc Testnet",
    chainId: 5042002,
    contractAddress: process.env.EDUFLOW_CONTRACT_ADDRESS ?? null,
    explorerBaseUrl: "https://testnet.arcscan.app",
  },

  milestones: [
    {
      id: "lesson_001",
      title: "Algebra Fundamentals",
      sequence: 1,
      status: "PENDING",
      paid: false,
      transactionId: null,
      transactionHash: null,
    },
    {
      id: "lesson_002",
      title: "Linear Equations",
      sequence: 2,
      status: "PENDING",
      paid: false,
      transactionId: null,
      transactionHash: null,
    },
    {
      id: "lesson_003",
      title: "Simultaneous Equations",
      sequence: 3,
      status: "PENDING",
      paid: false,
      transactionId: null,
      transactionHash: null,
    },
  ],
};

export function getPublicAgreement() {
  return structuredClone(demoAgreement);
}