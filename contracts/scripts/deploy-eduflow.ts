import { network } from "hardhat";

const ARC_CHAIN_ID = 5042002;

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

const { viem, networkName } = await network.create();

const publicClient = await viem.getPublicClient();
const walletClients = await viem.getWalletClients();

if (walletClients.length === 0) {
  throw new Error("No deployer wallet configured.");
}

const deployer = walletClients[0];
const chainId = await publicClient.getChainId();

if (chainId !== ARC_CHAIN_ID) {
  throw new Error(
    `Wrong network. Expected ${ARC_CHAIN_ID}, received ${chainId}.`,
  );
}

console.log("");
console.log(`Deploying EduFlowAgreement to ${networkName}...`);
console.log("Deployer:", deployer.account.address);
console.log("USDC:", USDC_ADDRESS);
console.log("Initial executor:", deployer.account.address);

const contract = await viem.deployContract(
  "EduFlowAgreement",
  [
    USDC_ADDRESS,
    deployer.account.address,
  ],
  {
    account: deployer.account,
    confirmations: 1,
  },
);

const bytecode = await publicClient.getCode({
  address: contract.address,
});

if (!bytecode || bytecode === "0x") {
  throw new Error("Deployment failed: no contract bytecode found.");
}

console.log("");
console.log("EduFlowAgreement deployed successfully");
console.log("--------------------------------------");
console.log("Contract address:", contract.address);
console.log(
  "Explorer:",
  `https://testnet.arcscan.app/address/${contract.address}`,
);
console.log("");
console.log("Save this address as EDUFLOW_CONTRACT_ADDRESS.");
