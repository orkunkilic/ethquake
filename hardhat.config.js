require("dotenv").config();
// require("@nomiclabs/hardhat-solhint");
require("@nomiclabs/hardhat-waffle");
require('solidity-coverage')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks:{
    hardhat: {
      gas: 1800000,
      initialBaseFeePerGas: 7
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        }
      },
    ],
  },
};
