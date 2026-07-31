import "dotenv/config";

const apiKey = process.env.CIRCLE_API_KEY;
const walletId = process.env.CIRCLE_EXECUTOR_WALLET_ID;

if (!apiKey || !walletId) {
  throw new Error(
    "CIRCLE_API_KEY and CIRCLE_EXECUTOR_WALLET_ID are required.",
  );
}

const url = new URL(
  "https://api.circle.com/v1/w3s/developer/wallets/balances",
);

url.searchParams.set("blockchain", "ARC-TESTNET");
url.searchParams.set("walletIds", walletId);

const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

const body = await response.json();

if (!response.ok) {
  console.error(JSON.stringify(body, null, 2));
  throw new Error(`Circle request failed with status ${response.status}`);
}

const wallet = body.data?.wallets?.find(
  (item) => item.id === walletId,
);

if (!wallet) {
  throw new Error("Circle executor wallet was not returned.");
}

console.log("");
console.log("EduFlow Circle Executor");
console.log("-----------------------");
console.log("Address:", wallet.address);
console.log("Blockchain:", wallet.blockchain);
console.log("State:", wallet.state);
console.log("");
console.log("Balances:");

for (const balance of wallet.tokenBalances ?? []) {
  console.log(
    `- ${balance.amount} ${balance.token?.symbol ?? "Unknown token"}`,
    balance.token?.isNative ? "(native gas)" : "",
  );
}
