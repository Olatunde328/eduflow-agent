import { network } from "hardhat";
import { formatUnits } from "viem";

const usdcAddress =
  process.env.USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000";

const { viem } = await network.create();
const [payer] = await viem.getWalletClients();

const usdc = await viem.getContractAt(
  "MockUSDC",
  usdcAddress,
);

const balance = await usdc.read.balanceOf([
  payer.account.address,
]);

console.log("Payer:", payer.account.address);
console.log("USDC balance:", formatUnits(balance, 6), "USDC");
