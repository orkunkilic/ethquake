require('dotenv').config();
require("@nomiclabs/hardhat-solhint");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    },
  },
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_API_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
