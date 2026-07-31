import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";

const TERMINAL_STATES = new Set([
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

function bytes32(value) {
  return `0x${createHash("sha256")
    .update(String(value))
    .digest("hex")}`;
}

function toUsdcBaseUnits(amount) {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw new Error("Payment amount must be a positive number.");
  }

  const baseUnits = Math.round(numericAmount * 1_000_000);

  if (!Number.isSafeInteger(baseUnits)) {
    throw new Error("Payment amount is outside the safe range.");
  }

  return String(baseUnits);
}

function buildClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: requireEnvironment("CIRCLE_API_KEY"),
    entitySecret: requireEnvironment("CIRCLE_ENTITY_SECRET"),
  });
}

function normalizeTransaction(transaction) {
  const hash =
    transaction?.txHash ??
    transaction?.transactionHash ??
    null;

  return {
    id: transaction?.id ?? null,
    state: transaction?.state ?? "UNKNOWN",
    operation: transaction?.operation ?? null,
    transactionHash: hash,
    explorerUrl: hash
      ? `https://testnet.arcscan.app/tx/${hash}`
      : null,
    createDate: transaction?.createDate ?? null,
    updateDate: transaction?.updateDate ?? null,
    errorReason: transaction?.errorReason ?? null,
  };
}

export async function getCircleTransaction(transactionId) {
  const apiKey = requireEnvironment("CIRCLE_API_KEY");

  const response = await fetch(
    `https://api.circle.com/v1/w3s/transactions/${encodeURIComponent(
      transactionId,
    )}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const body = await response.json();

  if (!response.ok) {
    const message =
      body?.message ??
      `Circle transaction lookup failed with status ${response.status}`;

    throw new Error(message);
  }

  return normalizeTransaction(body.data?.transaction ?? body.data);
}

export async function waitForCircleTransaction(
  transactionId,
  {
    timeoutMs = 45_000,
    intervalMs = 2_500,
  } = {},
) {
  const startedAt = Date.now();
  let latest = await getCircleTransaction(transactionId);

  while (
    !TERMINAL_STATES.has(latest.state) &&
    Date.now() - startedAt < timeoutMs
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, intervalMs),
    );

    latest = await getCircleTransaction(transactionId);
  }

  return latest;
}

export async function executeMilestonePayment({
  agreementId,
  milestoneId,
  amount,
  evidence,
}) {
  const walletId = requireEnvironment(
    "CIRCLE_EXECUTOR_WALLET_ID",
  );

  const contractAddress = requireAddress(
    "EDUFLOW_CONTRACT_ADDRESS",
    requireEnvironment("EDUFLOW_CONTRACT_ADDRESS"),
  );

  const client = buildClient();

  const milestoneIdHash = bytes32(
    `${agreementId}:${milestoneId}`,
  );

  const evidenceHash = bytes32(
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

  const idempotencyKey = randomUUID();

  const response =
    await client.createDeveloperTransactionContractExecution({
      idempotencyKey,
      walletId,
      contractAddress,
      abiFunctionSignature:
        "releaseMilestone(uint256,bytes32,uint256,bytes32)",
      abiParameters: [
        String(agreementId),
        milestoneIdHash,
        toUsdcBaseUnits(amount),
        evidenceHash,
      ],
      feeLevel: "MEDIUM",
      refId: `eduflow-${milestoneId}-${Date.now()}`,
    });

  const transactionId = response.data?.id;

  if (!transactionId) {
    throw new Error(
      "Circle accepted the request but returned no transaction ID.",
    );
  }

  const transaction = await waitForCircleTransaction(
    transactionId,
  );

  return {
    transactionId,
    idempotencyKey,
    milestoneIdHash,
    evidenceHash,
    submittedBy: requireEnvironment(
      "CIRCLE_EXECUTOR_ADDRESS",
    ),
    ...transaction,
    successful: SUCCESS_STATES.has(transaction.state),
  };
}