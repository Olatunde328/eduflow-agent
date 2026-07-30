import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [
    hardhatToolboxViemPlugin,
    hardhatKeystore,
  ],

  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },

      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    arcTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://rpc.testnet.arc.io",
      accounts: [configVariable("ARC_PRIVATE_KEY")],
    },
  },
});
