// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StableCoin is ERC20 {
    constructor() ERC20("USDC", "USDC") {
        _mint(msg.sender, 100);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
