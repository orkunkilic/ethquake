// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DeedNFT is ERC721, AccessControl {    
    bytes32 public constant MINTER_ROLE = keccak256("NOTARY__ROLE");
    bytes32 public constant STATE_ROLE = keccak256("STATE_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");


    /*
	OUR ADDRESS STANDART

       	[City Identifier Number] ** Istanbul is default and denotated with 0
       	[District Identifier Number] ** Bebek is default and denotated with 0
       	[Street Identifier Number] ** Bogazici is default and denotated with 0
	[Building Number] ** uint value of building number
	[Door Number] ** uint value ofdoor number	
     	
    */
    struct Metadata {
    uint cityId;
    uint districtId;
    uint streetId;
    uint buildingNum;
    uint doorNum;
    uint marketValue;
    uint EarthquakeScore;
    uint zipcode;
    uint latitude;
    uint longitude;
    }
    
    mapping(tokenId => Metadata) public tokenIdToRealEstate;

    constructor(address owner_,address notary_) ERC721("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STATE_ROLE, msg.sender);
	_grantRole(NOTARY_ROLE, notary_);
	_grantRole(OWNER_ROLE, owner;
    }

    function getterForMetadata(uint tokenId_) public {
    	return tokenIdToRealEstate[tokenId_];
    }

    function setterForMetadata(uint tokenId_, uint cityId,uint districtId,uint streetId, uint buildingNum,uint doorNum, uint marketValue, uint universalIdentifierIfExists,uint EarthquakeScore, uint zipcode, uint latitude, uint longitude) public onlyRole(STATE_ROLE) {
        
	 Metadata memory metadata = new Metadata(
	 cityId,
	 districtId,
	 streetId,
	 buildingNum,
	 doorNum,
         marketValue,
	 EarthquakeScore,
	 zipcode,
	 latitude,
	 longitude );
	 
	 tokenIdToRealEstate[tokenId_] = metadata;
    }

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
