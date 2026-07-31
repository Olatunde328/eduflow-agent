import { network } from "hardhat";
import { parseUnits } from "viem";

const CONTRACT_ADDRESS = process.env.EDUFLOW_CONTRACT_ADDRESS;
const PROVIDER_ADDRESS = process.env.CIRCLE_PROVIDER_ADDRESS;
const USDC_ADDRESS =
  process.env.USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000";

const TOTAL_BUDGET = parseUnits("30", 6);
const MAX_PER_MILESTONE = parseUnits("10", 6);

function requireAddress(name: string, value?: string) {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} must be a valid EVM address.`);
  }

  return value as `0x${string}`;
}

const contractAddress = requireAddress(
  "EDUFLOW_CONTRACT_ADDRESS",
  CONTRACT_ADDRESS,
);

const providerAddress = requireAddress(
  "CIRCLE_PROVIDER_ADDRESS",
  PROVIDER_ADDRESS,
);

const usdcAddress = requireAddress(
  "USDC_ADDRESS",
  USDC_ADDRESS,
);

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

const owner = await eduFlow.read.owner();

if (
  payer.account.address.toLowerCase() !==
  owner.toLowerCase()
) {
  throw new Error(
    `Configured deployer is not the contract owner. Owner: ${owner}`,
  );
}

if (
  payer.account.address.toLowerCase() ===
  providerAddress.toLowerCase()
) {
  throw new Error("Payer and provider must use different addresses.");
}

const payerBalance = await usdc.read.balanceOf([
  payer.account.address,
]);

if (payerBalance < TOTAL_BUDGET) {
  throw new Error(
    `Payer requires at least 30 ERC-20 USDC. Current base-unit balance: ${payerBalance}`,
  );
}

console.log("");
console.log("Creating funded EduFlow agreement");
console.log("---------------------------------");
console.log("Payer:", payer.account.address);
console.log("Provider:", providerAddress);
console.log("Budget: 30 USDC");
console.log("Maximum per milestone: 10 USDC");

const approveHash = await usdc.write.approve(
  [contractAddress, TOTAL_BUDGET],
  {
    account: payer.account,
  },
);

console.log("");
console.log("Approval submitted:", approveHash);

const approveReceipt =
  await publicClient.waitForTransactionReceipt({
    hash: approveHash,
  });

if (approveReceipt.status !== "success") {
  throw new Error("USDC approval transaction reverted.");
}

const latestBlock = await publicClient.getBlock();
const expiresAt =
  latestBlock.timestamp + 30n * 24n * 60n * 60n;

const agreementId =
  await eduFlow.read.nextAgreementId();

const createHash = await eduFlow.write.createAgreement(
  [
    providerAddress,
    TOTAL_BUDGET,
    MAX_PER_MILESTONE,
    expiresAt,
  ],
  {
    account: payer.account,
  },
);

console.log("Agreement transaction submitted:", createHash);

const createReceipt =
  await publicClient.waitForTransactionReceipt({
    hash: createHash,
  });

if (createReceipt.status !== "success") {
  throw new Error("Agreement creation transaction reverted.");
}

const agreement = await eduFlow.read.getAgreement([
  agreementId,
]);

const contractBalance = await usdc.read.balanceOf([
  contractAddress,
]);

console.log("");
console.log("======================================");
console.log("FUNDED EDUFLOW AGREEMENT CREATED");
console.log("======================================");
console.log("Agreement ID:", agreementId.toString());
console.log("Payer:", agreement.payer);
console.log("Provider:", agreement.provider);
console.log("Escrowed budget:", contractBalance.toString(), "base units");
console.log("Agreement transaction:", createHash);
console.log(
  "Explorer:",
  `https://testnet.arcscan.app/tx/${createHash}`,
);
console.log("======================================");
