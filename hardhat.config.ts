import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
// import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-preprocessor";

import * as dotenv from "dotenv";
import {
  HardhatRuntimeEnvironment,
  LinePreprocessorConfig,
} from "hardhat/types";

dotenv.config({ path: __dirname + "/.env" });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
    ],
  },

  paths: {
    artifacts: "./artifacts",
  },

  networks: {
    base: {
      chainId: 8453,
      url: `https://${process.env.BASE_URL}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
    },

    baseSepolia: {
      chainId: 84532,
      url: `https://${process.env.BASE_SEPOLIA_URL}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : { mnemonic: process.env.MNEMONIC as string },
    },

    hardhat: {
      /*forking: {
        url: `https://${process.env.POLYGON_URL}`,
      },*/
      allowUnlimitedContractSize: true,
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545",
      accounts:
        process.env.PRIVATE_KEY_LOCALHOST !== undefined
          ? [process.env.PRIVATE_KEY_LOCALHOST]
          : { mnemonic: process.env.MNEMONIC_LOCALHOST as string },
      allowUnlimitedContractSize: false,
    },
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

  w3f: {
    rootDir: "./gelato",
    debug: false,
    networks: ["mumbai", "polygon"],
  },

  preprocess: {
    eachLine: testnetEpochDuration((hre) =>
      ["mumbai", "hardhat", "localhost"].includes(hre.network.name)
    ),
  },

  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY,
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: process.env.BASE_API_URL,
          browserURL: process.env.BASE_BROWSER_URL,
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: process.env.BASE_SEPOLIA_API_URL,
          browserURL: process.env.BASE_SEPOLIA_BROWSER_URL,
        },
      },
    ],
  },

  mocha: {
    timeout: 100000000,
  },
};

function testnetEpochDuration(
  condition?: (hre: HardhatRuntimeEnvironment) => any
): (
  hre: HardhatRuntimeEnvironment
) => Promise<LinePreprocessorConfig | undefined> {
  const preprocess = {
    transform: (line: string, sourceInfo: { absolutePath: string }): string => {
      return line
        .replace(
          /\bEPOCH_DURATION\s*=\s*[^;]*;/,
          `EPOCH_DURATION = 20 minutes;`
        )
        .replace(
          /PREVIOUS_IMPLEMENTATION = 0xf484c4AB97ee393F8D1aF6948B70bd88a033cBAB/,
          "PREVIOUS_IMPLEMENTATION = 0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575"
        );
    },
    settings: { removeLog: true },
  };
  return async (
    hre: HardhatRuntimeEnvironment
  ): Promise<LinePreprocessorConfig | undefined> => {
    if (typeof condition === "function") {
      const cond = condition(hre);
      const promise = cond as Promise<boolean>;
      if (typeof cond === "object" && "then" in promise) {
        return promise.then((v) => (v ? preprocess : undefined));
      } else if (!cond) {
        return Promise.resolve(undefined);
      }
    }
    return Promise.resolve(preprocess);
  };
}

export default config;
