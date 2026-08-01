import { createHash } from "node:crypto";
import { network } from "hardhat";
import { formatUnits } from "viem";

const agreementId = 1n;
const contractAddress = process.env.EDUFLOW_CONTRACT_ADDRESS;

if (
  !contractAddress ||
  !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)
) {
  throw new Error(
    "EDUFLOW_CONTRACT_ADDRESS is missing or invalid.",
  );
}

function milestoneHash(milestoneId: string) {
  return `0x${createHash("sha256")
    .update(`${agreementId}:${milestoneId}`)
    .digest("hex")}` as `0x${string}`;
}

const { viem } = await network.create();

const contract = await viem.getContractAt(
  "EduFlowAgreement",
  contractAddress as `0x${string}`,
);

const agreement = await contract.read.getAgreement([
  agreementId,
]);

const remaining = await contract.read.remainingBudget([
  agreementId,
]);

const milestones = [
  "lesson_001",
  "lesson_002",
  "lesson_003",
];

console.log("");
console.log("======================================");
console.log("EDUFLOW AUTHORITATIVE ARC STATE");
console.log("======================================");
console.log("Contract:", contractAddress);
console.log("Agreement ID:", agreementId.toString());
console.log("Payer:", agreement.payer);
console.log("Provider:", agreement.provider);
console.log(
  "Total budget:",
  formatUnits(agreement.totalBudget, 6),
  "USDC",
);
console.log(
  "Amount paid:",
  formatUnits(agreement.amountPaid, 6),
  "USDC",
);
console.log(
  "Remaining budget:",
  formatUnits(remaining, 6),
  "USDC",
);
console.log("");

for (const milestoneId of milestones) {
  const hash = milestoneHash(milestoneId);

  const paid = await contract.read.paidMilestones([
    agreementId,
    hash,
  ]);

  console.log(
    `${milestoneId}:`,
    paid ? "PAID" : "PENDING",
  );
}

console.log("======================================");