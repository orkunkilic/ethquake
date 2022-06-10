// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DeedNFT is ERC721Enumerable, AccessControl {    
    bytes32 public constant NOTARY_ROLE = keccak256("NOTARY_ROLE");
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

    /*
    UPDATE
    houseId is unique identifier of a house.
    
    */
    struct Metadata {
    uint houseId;
    uint marketValue;
    uint riskScore;
    uint zipCode;
    int latitude;
    int longitude;
    }
    
    mapping(uint => Metadata) public tokenIdToRealEstate;
    mapping(uint => uint) public houseIdToTokenId;

    constructor(address houseOwner, address notary) ERC721("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STATE_ROLE, msg.sender);
	_grantRole(NOTARY_ROLE, notary);
	_grantRole(OWNER_ROLE, houseOwner);
    }

    function getMetadata(uint tokenId_) public view returns(Metadata memory) {
    	return tokenIdToRealEstate[tokenId_];
    }

    function tokenIdByHouseId(uint tokenId) public view returns(uint){
    	return houseIdToTokenId[tokenId];
    }

    function getZipcode(uint houseId) public view returns(uint){
	return tokenIdToRealEstate[tokenIdByHouseId(houseId)].zipCode;
    }
   
    function getRisk(uint houseId) public view returns(uint){
        return tokenIdToRealEstate[tokenIdByHouseId(houseId)].riskScore;
    }

    function getPrice(uint houseId) public view returns(uint){
        return tokenIdToRealEstate[tokenIdByHouseId(houseId)].marketValue;
    }

    function setMetadata(uint tokenId_, uint houseId, uint marketValue, uint riskScore, uint zipCode , int latitude, int longitude) public onlyRole(STATE_ROLE) {
       
	 Metadata memory metadata = Metadata(
	 houseId,
     marketValue,
	 riskScore,
	 zipCode,
	 latitude,
	 longitude );
	 
	 tokenIdToRealEstate[tokenId_] = metadata;
    }

    function safeMint(address to, uint256 tokenId) public onlyRole(STATE_ROLE) {
        _safeMint(to, tokenId);
    }


    function tokenIdsByAddress(address addressToQuery) public view returns(uint256[]  memory) {
	uint balance_ =  balanceOf(addressToQuery);
	uint256[] memory tokenIds = new uint256[](balance_);
	for(uint256 i=0;i<balance_;i++){
	   tokenIds[i] =  tokenOfOwnerByIndex(addressToQuery,i);
	}
	return tokenIds;
    }

    function transferDeed(uint256 tokenId, address from_, address to_, bytes memory sigOfSender, bytes memory sigOfReceiver) external onlyRole(STATE_ROLE){
        require(from_ == recover(keccak256(abi.encodePacked(tokenId)),sigOfSender));
        require(to_ == recover(keccak256(abi.encodePacked(tokenId)),sigOfReceiver));
        _transfer(from_,to_,tokenId);

    }

    function recover(bytes32 hash, bytes memory sig) public pure returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    //Check the signature length
    if (sig.length != 65) {
      return (address(0));
    }

    // Divide the signature in r, s and v variables
    assembly {
      r := mload(add(sig, 32))
      s := mload(add(sig, 64))
      v := byte(0, mload(add(sig, 96)))
    }

    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }

    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return (address(0));
    } else {
      return ecrecover(hash, v, r, s);
    }
  }
    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

}