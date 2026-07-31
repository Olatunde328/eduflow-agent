import { network } from "hardhat";

const contractAddress = process.env.EDUFLOW_CONTRACT_ADDRESS;
const newExecutor = process.env.CIRCLE_EXECUTOR_ADDRESS;

if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  throw new Error("Valid EDUFLOW_CONTRACT_ADDRESS is required.");
}

if (!newExecutor || !/^0x[a-fA-F0-9]{40}$/.test(newExecutor)) {
  throw new Error("Valid CIRCLE_EXECUTOR_ADDRESS is required.");
}

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const [ownerWallet] = await viem.getWalletClients();

const contract = await viem.getContractAt(
  "EduFlowAgreement",
  contractAddress,
);

const currentOwner = await contract.read.owner();
const previousExecutor = await contract.read.executor();

if (
  ownerWallet.account.address.toLowerCase() !==
  currentOwner.toLowerCase()
) {
  throw new Error(
    `Configured wallet is not the owner. Contract owner: ${currentOwner}`,
  );
}

console.log("");
console.log("Updating EduFlow executor");
console.log("-------------------------");
console.log("Contract:", contractAddress);
console.log("Owner:", currentOwner);
console.log("Previous executor:", previousExecutor);
console.log("New Circle executor:", newExecutor);

const hash = await contract.write.updateExecutor(
  [newExecutor],
  {
    account: ownerWallet.account,
  },
);

console.log("Transaction submitted:", hash);

const receipt = await publicClient.waitForTransactionReceipt({
  hash,
});

if (receipt.status !== "success") {
  throw new Error("Executor update reverted.");
}

const confirmedExecutor = await contract.read.executor();

if (
  confirmedExecutor.toLowerCase() !==
  newExecutor.toLowerCase()
) {
  throw new Error("Executor address was not updated correctly.");
}

console.log("");
console.log("CIRCLE EXECUTOR ROLE CONFIRMED");
console.log("------------------------------");
console.log("Transaction hash:", hash);
console.log("New executor:", confirmedExecutor);
console.log(
  "Explorer:",
  `https://testnet.arcscan.app/tx/${hash}`,
);
