require('dotenv').config();
// require("@nomiclabs/hardhat-solhint");
require("@nomiclabs/hardhat-waffle");


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
  }
};
