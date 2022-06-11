pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract PoolToken is ERC20 {
    constructor() ERC20("Pool 1", "P1") {
        _mint(msg.sender, 100);
    }
}