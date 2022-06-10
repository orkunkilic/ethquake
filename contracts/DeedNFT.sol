// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DeedNFT is ERC721, AccessControl {    
    bytes32 public constant MINTER_ROLE = keccak256("NOTARY__ROLE");
    bytes32 public constant STATE_ROLE = keccak256("STATE_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    struct Metadata {
    string addressShoulBeStandart;
    uint marketValue;
    uint universalIdentifierIfExists;
    uint EarthquakeScore;
    }
    
    mapping(tokenId => Metadata) public tokenIdToRealEstate;

    constructor() ERC721("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function getterForMetadata() public {}
    function setterForMetadata() public onlyRole(STATE_ROLE)
    function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
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
