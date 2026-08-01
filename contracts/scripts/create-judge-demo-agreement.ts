import { network } from "hardhat";
import { parseUnits } from "viem";

const contractAddress = process.env.EDUFLOW_CONTRACT_ADDRESS;
const providerAddress = process.env.CIRCLE_PROVIDER_ADDRESS;
const usdcAddress =
  process.env.USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000";

if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  throw new Error("Invalid EDUFLOW_CONTRACT_ADDRESS.");
}

if (!providerAddress || !/^0x[a-fA-F0-9]{40}$/.test(providerAddress)) {
  throw new Error("Invalid CIRCLE_PROVIDER_ADDRESS.");
}

const totalBudget = parseUnits("30", 6);
const milestoneLimit = parseUnits("10", 6);

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const [payer] = await viem.getWalletClients();

const eduFlow = await viem.getContractAt(
  "EduFlowAgreement",
  contractAddress,
);

const usdc = await viem.getContractAt(
  "MockUSDC",
  usdcAddress,
);

const balance = await usdc.read.balanceOf([
  payer.account.address,
]);

if (balance < totalBudget) {
  throw new Error(
    `Payer needs 30 USDC. Current balance: ${balance.toString()} base units.`,
  );
}

const agreementId = await eduFlow.read.nextAgreementId();

console.log("");
console.log("Creating fresh EduFlow judge-demo agreement");
console.log("-------------------------------------------");
console.log("Agreement ID:", agreementId.toString());
console.log("Payer:", payer.account.address);
console.log("Provider:", providerAddress);

const approveHash = await usdc.write.approve(
  [contractAddress, totalBudget],
  { account: payer.account },
);

await publicClient.waitForTransactionReceipt({
  hash: approveHash,
});

const latestBlock = await publicClient.getBlock();
const expiresAt =
  latestBlock.timestamp + 30n * 24n * 60n * 60n;

const createHash = await eduFlow.write.createAgreement(
  [
    providerAddress,
    totalBudget,
    milestoneLimit,
    expiresAt,
  ],
  { account: payer.account },
);

const receipt = await publicClient.waitForTransactionReceipt({
  hash: createHash,
});

if (receipt.status !== "success") {
  throw new Error("Fresh agreement creation reverted.");
}

const agreement = await eduFlow.read.getAgreement([
  agreementId,
]);

console.log("");
console.log("======================================");
console.log("FRESH JUDGE-DEMO AGREEMENT CREATED");
console.log("======================================");
console.log("Agreement ID:", agreementId.toString());
console.log("Total budget:", agreement.totalBudget.toString());
console.log("Amount paid:", agreement.amountPaid.toString());
console.log("Transaction:", createHash);
console.log(
  "Explorer:",
  `https://testnet.arcscan.app/tx/${createHash}`,
);
console.log("======================================");