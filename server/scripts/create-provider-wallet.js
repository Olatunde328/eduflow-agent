import "dotenv/config";
import {
  appendFileSync,
  existsSync,
  readFileSync,
} from "node:fs";
import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";

const required = [
  "CIRCLE_API_KEY",
  "CIRCLE_ENTITY_SECRET",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`${name} is missing from server/.env`);
  }
}

const envContent = existsSync(".env")
  ? readFileSync(".env", "utf8")
  : "";

if (/^CIRCLE_PROVIDER_WALLET_ID=/m.test(envContent)) {
  throw new Error(
    "A Circle provider wallet already exists in .env. Refusing to create another.",
  );
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

function appendEnv(name, value) {
  appendFileSync(".env", `\n${name}=${value}`);
}

async function main() {
  console.log("");
  console.log("Creating EduFlow Provider wallet set...");

  const walletSetResponse = await client.createWalletSet({
    name: "EduFlow Tutor Provider",
  });

  const walletSet = walletSetResponse.data?.walletSet;

  if (!walletSet?.id) {
    throw new Error("Circle did not return the provider wallet-set ID.");
  }

  const walletResponse = await client.createWallets({
    walletSetId: walletSet.id,
    blockchains: ["ARC-TESTNET"],
    accountType: "EOA",
    count: 1,
    metadata: [
      {
        name: "EduFlow Demo Tutor",
        refId: "eduflow-demo-tutor",
      },
    ],
  });

  const wallet = walletResponse.data?.wallets?.[0];

  if (!wallet?.id || !wallet?.address) {
    throw new Error(
      "Circle did not return the provider wallet ID and address.",
    );
  }

  appendEnv("CIRCLE_PROVIDER_WALLET_SET_ID", walletSet.id);
  appendEnv("CIRCLE_PROVIDER_WALLET_ID", wallet.id);
  appendEnv("CIRCLE_PROVIDER_ADDRESS", wallet.address);

  console.log("");
  console.log("======================================");
  console.log("EDUFLOW PROVIDER WALLET CREATED");
  console.log("======================================");
  console.log("Wallet Set ID:", walletSet.id);
  console.log("Wallet ID:", wallet.id);
  console.log("Provider address:", wallet.address);
  console.log("Blockchain:", wallet.blockchain);
  console.log("======================================");
}

main().catch((error) => {
  console.error("");
  console.error("Provider wallet creation failed:");
  console.error(
    error.response?.data
      ? JSON.stringify(error.response.data, null, 2)
      : error.message ?? error,
  );
  process.exit(1);
});
