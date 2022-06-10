// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DeedNFT is ERC721, AccessControl {    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TRANSFER_ADMIN_ROLE = keccak256("TRANSFER_ADMIN_ROLE");

    constructor() ERC721("DeedNFT", "DNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(hasRole("TRANSFER_ADMIN_ROLE", msg.sender));
        _transfer(from, to, tokenId);
        // ?
    }

    function transfer(address from, address to, uint256 tokenId, bytes32 ownerSignature, bytes32 receiverSignature) public onlyRole(TRANSFER_ADMIN_ROLE) {
        // Make EIP-712 Compatible

        _transfer(from, to, tokenId);
    }
    
    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

}