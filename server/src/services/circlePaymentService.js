import "dotenv/config";
import { createHash } from "node:crypto";

const FINAL_STATES = new Set([
  "COMPLETE",
  "FAILED",
  "DENIED",
  "CANCELLED",
]);

const SUCCESS_STATES = new Set([
  "COMPLETE",
  "CONFIRMED",
]);

function requireEnvironment(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing from server/.env`);
  }

  return value;
}

function requireAddress(name, value) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} is not a valid EVM address.`);
  }

  return value;
}

function toBytes32(value) {
  return `0x${createHash("sha256")
    .update(String(value))
    .digest("hex")}`;
}

function toUsdcBaseUnits(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Payment amount must be a positive number.");
  }

  const baseUnits = Math.round(numericAmount * 1_000_000);

  if (!Number.isSafeInteger(baseUnits)) {
    throw new Error("Payment amount is outside the safe range.");
  }

  return String(baseUnits);
}

async function createCircleClient() {
  const CircleWalletsSdk = await import(
    "@circle-fin/developer-controlled-wallets"
  );

  const factory =
    CircleWalletsSdk.initiateDeveloperControlledWalletsClient ??
    CircleWalletsSdk.default?.initiateDeveloperControlledWalletsClient ??
    CircleWalletsSdk.default;

  if (typeof factory !== "function") {
    throw new Error(
      "Circle SDK client factory is unavailable in this runtime.",
    );
  }

  return factory({
    apiKey: requireEnvironment("CIRCLE_API_KEY"),
    entitySecret: requireEnvironment("CIRCLE_ENTITY_SECRET"),
  });
}
function normalizeTransaction(transaction) {
  const transactionHash =
    transaction?.txHash ??
    transaction?.transactionHash ??
    null;

  return {
    id: transaction?.id ?? null,
    transactionId: transaction?.id ?? null,
    state: transaction?.state ?? "UNKNOWN",
    operation: transaction?.operation ?? null,
    transactionHash,
    explorerUrl: transactionHash
      ? `https://testnet.arcscan.app/tx/${transactionHash}`
      : null,
    createDate: transaction?.createDate ?? null,
    updateDate: transaction?.updateDate ?? null,
    errorReason:
      transaction?.errorReason ??
      transaction?.errorDetails ??
      null,
  };
}

export async function getCircleTransaction(transactionId) {
  const apiKey = requireEnvironment("CIRCLE_API_KEY");

  const response = await fetch(
    `https://api.circle.com/v1/w3s/transactions/${encodeURIComponent(
      transactionId,
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      body?.message ??
        body?.error ??
        `Circle lookup failed with status ${response.status}`,
    );
  }

  return normalizeTransaction(
    body.data?.transaction ?? body.data,
  );
}

export async function waitForCircleTransaction(
  transactionId,
  {
    timeoutMs = 60_000,
    intervalMs = 2_500,
  } = {},
) {
  const startedAt = Date.now();
  let transaction =
    await getCircleTransaction(transactionId);

  while (
    !FINAL_STATES.has(transaction.state) &&
    Date.now() - startedAt < timeoutMs
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, intervalMs),
    );

    transaction =
      await getCircleTransaction(transactionId);
  }

  return transaction;
}

export async function executeMilestonePayment({
  agreementId,
  milestoneId,
  amount,
  evidence,
}) {
  const executorAddress = requireAddress(
    "CIRCLE_EXECUTOR_ADDRESS",
    requireEnvironment("CIRCLE_EXECUTOR_ADDRESS"),
  );

  const contractAddress = requireAddress(
    "EDUFLOW_CONTRACT_ADDRESS",
    requireEnvironment("EDUFLOW_CONTRACT_ADDRESS"),
  );

  const milestoneIdHash = toBytes32(
    `${agreementId}:${milestoneId}`,
  );

  const evidenceHash = toBytes32(
    JSON.stringify({
      agreementId,
      milestoneId,
      durationMinutes: evidence.durationMinutes,
      learnerConfirmed: evidence.learnerConfirmed,
      assessmentScore: evidence.assessmentScore,
      requestedAmount: evidence.requestedAmount,
      tutorStatement: evidence.tutorStatement ?? "",
    }),
  );

  const client = await createCircleClient();

  console.log("");
  console.log("Submitting Circle contract execution");
  console.log("------------------------------------");
  console.log("Executor:", executorAddress);
  console.log("Contract:", contractAddress);
  console.log("Agreement:", agreementId);
  console.log("Milestone:", milestoneId);
  console.log("Amount:", amount, "USDC");

  const response =
    await client.createContractExecutionTransaction({
      walletAddress: executorAddress,
      blockchain: "ARC-TESTNET",
      contractAddress,
      abiFunctionSignature:
        "releaseMilestone(uint256,bytes32,uint256,bytes32)",
      abiParameters: [
        String(agreementId),
        milestoneIdHash,
        toUsdcBaseUnits(amount),
        evidenceHash,
      ],
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
    });

  const transactionId =
    response.data?.id ??
    response.data?.transactionId;

  if (!transactionId) {
    console.error(
      "Unexpected Circle response:",
      JSON.stringify(response.data, null, 2),
    );

    throw new Error(
      "Circle accepted no transaction ID.",
    );
  }

  console.log("Circle transaction ID:", transactionId);

  const transaction =
    await waitForCircleTransaction(transactionId);

  console.log("Circle transaction state:", transaction.state);

  if (transaction.transactionHash) {
    console.log(
      "Arc transaction hash:",
      transaction.transactionHash,
    );
  }

  return {
    ...transaction,
    transactionId,
    milestoneIdHash,
    evidenceHash,
    submittedBy: executorAddress,
    successful: SUCCESS_STATES.has(transaction.state),
  };
}