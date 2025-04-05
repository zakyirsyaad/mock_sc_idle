import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
    mantaPacificTestnet: {
      url: "https://pacific-rpc.sepolia-testnet.manta.network/http",
      accounts: [PRIVATE_KEY],
      chainId: 3441006,
    },
    sonicTestnet: {
      url: "https://rpc.blaze.soniclabs.com",
      accounts: [PRIVATE_KEY],
      chainId: 57054,
    },
    sepolia: {
      url: "https://sepolia.drpc.org",
      accounts: [PRIVATE_KEY],
      chainId: 11_155_111,
    },
    opencampus: {
      url: `https://rpc.open-campus-codex.gelato.digital/`,
      accounts: [PRIVATE_KEY],
      chainId: 656476,
    },
  },
  etherscan: {
    apiKey: {
      mantaPacificTestnet: "any",
      sonicTestnet: "SBTRRBEV9FWZFVAKBIKDYY5VY42B3Z4SKA",
      sepolia: "IB97Q9W2ZQIB1TI4NXSWK5VZIYQ26G7CZU",
      opencampus: "XXX",
    },
    customChains: [
      {
        network: "mantaPacificTestnet",
        chainId: 3441006,
        urls: {
          apiURL: "https://pacific-explorer.sepolia-testnet.manta.network/api",
          browserURL: "https://pacific-explorer.sepolia-testnet.manta.network",
        },
      },
      {
        network: "sonicTestnet",
        chainId: 57054,
        urls: {
          apiURL: "https://api-testnet.sonicscan.org/api",
          browserURL: "https://testnet.sonicscan.org",
        },
      },
      {
        network: "sepolia",
        chainId: 11_155_111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
      {
        network: "opencampus",
        chainId: 656476,
        urls: {
          apiURL: "https://edu-chain-testnet.blockscout.com/api",
          browserURL: "https://edu-chain-testnet.blockscout.com",
        },
      },
    ],
  },
};

export default config;
