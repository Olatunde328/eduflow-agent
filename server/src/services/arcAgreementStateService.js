import { createHash } from "node:crypto";
import {
  createPublicClient,
  defineChain,
  formatUnits,
  http,
} from "viem";

function requireEnvironment(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for Arc state reads.`);
  }

  return value;
}

const arcTestnet = defineChain({
  id: Number(process.env.ARC_CHAIN_ID || 5042002),
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.ARC_RPC_URL ||
          "https://rpc.testnet.arc.io",
      ],
    },
  },
});

const agreementReadAbi = [
  {
    type: "function",
    name: "remainingBudget",
    stateMutability: "view",
    inputs: [
      {
        name: "agreementId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "paidMilestones",
    stateMutability: "view",
    inputs: [
      {
        name: "agreementId",
        type: "uint256",
      },
      {
        name: "milestoneId",
        type: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
];

function milestoneHash(agreementId, milestoneId) {
  return `0x${createHash("sha256")
    .update(`${agreementId}:${milestoneId}`)
    .digest("hex")}`;
}

function createArcClient() {
  return createPublicClient({
    chain: arcTestnet,
    transport: http(
      requireEnvironment("ARC_RPC_URL"),
    ),
  });
}

export async function hydrateAgreementFromArc(agreement) {
  if (!agreement?.onchainAgreementId) {
    throw new Error(
      "A valid agreement with onchainAgreementId is required.",
    );
  }

  const agreementId = BigInt(
    agreement.onchainAgreementId,
  );

  const contractAddress = requireEnvironment(
    "EDUFLOW_CONTRACT_ADDRESS",
  );

  const client = createArcClient();

  const remainingBaseUnits =
    await client.readContract({
      address: contractAddress,
      abi: agreementReadAbi,
      functionName: "remainingBudget",
      args: [agreementId],
    });

  const remainingBudget = Number(
    formatUnits(remainingBaseUnits, 6),
  );

  const milestones = await Promise.all(
    agreement.milestones.map(async (milestone) => {
      const paid = await client.readContract({
        address: contractAddress,
        abi: agreementReadAbi,
        functionName: "paidMilestones",
        args: [
          agreementId,
          milestoneHash(
            agreement.onchainAgreementId,
            milestone.id,
          ),
        ],
      });

      return {
        ...milestone,
        status: paid ? "PAID" : "PENDING",
        paid,
        transactionId: paid
          ? milestone.transactionId
          : null,
        transactionHash: paid
          ? milestone.transactionHash
          : null,
      };
    }),
  );

  return {
    ...agreement,
    amountPaid:
      agreement.totalBudget - remainingBudget,
    remainingBudget,
    milestones,
    stateSource: "ARC_ONCHAIN",
    syncedAt: new Date().toISOString(),
  };
}