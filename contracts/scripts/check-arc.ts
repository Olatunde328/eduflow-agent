import { network } from "hardhat";
import { formatUnits } from "viem";

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

const nativeBalance = await publicClient.getBalance({
  address: deployer.account.address,
});

const usdc = await viem.getContractAt(
  "MockUSDC",
  USDC_ADDRESS,
  {
    client: {
      public: publicClient,
    },
  },
);

const erc20Balance = await usdc.read.balanceOf([
  deployer.account.address,
]);

console.log("");
console.log("Arc connection successful");
console.log("-------------------------");
console.log("Network:", networkName);
console.log("Chain ID:", chainId);
console.log("Deployer:", deployer.account.address);
console.log(
  "Native gas balance:",
  formatUnits(nativeBalance, 18),
  "USDC",
);
console.log(
  "ERC-20 USDC balance:",
  formatUnits(erc20Balance, 6),
  "USDC",
);
console.log(
  "Explorer:",
  `https://testnet.arcscan.app/address/${deployer.account.address}`,
);
