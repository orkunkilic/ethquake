// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DeinsuranceToken is ERC20 {
    constructor() ERC20("Deinsurance Token", "DT") {
        _mint(msg.sender, 100);
    }
}
