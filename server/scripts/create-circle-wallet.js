import "dotenv/config";
import { appendFileSync, readFileSync } from "node:fs";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

if (!apiKey || !entitySecret) {
  throw new Error(
    "CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must exist in server/.env",
  );
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});

function appendEnvVariable(name, value) {
  const envContent = readFileSync(".env", "utf8");

  if (new RegExp(`^${name}=`, "m").test(envContent)) {
    console.warn(`${name} already exists in .env; it was not overwritten.`);
    return;
  }

  appendFileSync(".env", `\n${name}=${value}\n`);
}

async function main() {
  console.log("Creating EduFlow SkillPay wallet set...");

  const walletSetResponse = await client.createWalletSet({
    name: "EduFlow SkillPay Agent",
  });

  const walletSet = walletSetResponse.data?.walletSet;

  if (!walletSet?.id) {
    throw new Error("Circle did not return a wallet set ID.");
  }

  console.log("Wallet set created:", walletSet.id);
  console.log("Creating the Arc Testnet executor wallet...");

  const walletResponse = await client.createWallets({
    walletSetId: walletSet.id,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "EOA",
    metadata: [
      {
        name: "EduFlow SkillPay Executor",
        refId: "eduflow-skillpay-executor",
      },
    ],
  });

  const wallet = walletResponse.data?.wallets?.[0];

  if (!wallet?.id || !wallet?.address) {
    throw new Error("Circle did not return the wallet ID and address.");
  }

  appendEnvVariable("CIRCLE_WALLET_SET_ID", walletSet.id);
  appendEnvVariable("CIRCLE_EXECUTOR_WALLET_ID", wallet.id);
  appendEnvVariable("CIRCLE_EXECUTOR_ADDRESS", wallet.address);

  console.log("");
  console.log("======================================");
  console.log("EDUFLOW SKILLPAY EXECUTOR CREATED");
  console.log("======================================");
  console.log("Wallet Set ID:", walletSet.id);
  console.log("Wallet ID:", wallet.id);
  console.log("Address:", wallet.address);
  console.log("Blockchain:", wallet.blockchain);
  console.log("Account type:", wallet.accountType);
  console.log("======================================");
  console.log("");
  console.log("Wallet details were added to server/.env.");
}

main().catch((error) => {
  console.error("");
  console.error("Circle wallet creation failed.");

  if (error.response?.data) {
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error.message ?? error);
  }

  process.exit(1);
});
