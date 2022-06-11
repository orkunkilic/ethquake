// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DeedNFT is ERC721Enumerable, AccessControl {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Metadata {
        uint256 houseId;
        uint256 marketValue;
        uint8 riskScore;
        uint256 zipCode;
        int256 latitude;
        int256 longitude;
    }

    mapping(uint256 => Metadata) public metadata;
    mapping(uint256 => uint256) public houseIdToTokenId;

    event MintDeed(address indexed owner, uint256 indexed tokenId, uint256 houseId);
    event TransferDeed(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() ERC721("DeedNFT", "DNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TRANSFER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _tokenIdCounter.increment();
    }

    function getMetadata(uint256 tokenId_)
        public
        view
        returns (Metadata memory)
    {
        return metadata[tokenId_];
    }

    function tokenIdByHouseId(uint256 tokenId) public view returns (uint256) {
        return houseIdToTokenId[tokenId];
    }

    function getZipcode(uint256 houseId) public view returns (uint256) {
        return metadata[tokenIdByHouseId(houseId)].zipCode;
    }

    function getRisk(uint256 houseId) public view returns (uint8) {
        return metadata[tokenIdByHouseId(houseId)].riskScore;
    }

    function getPrice(uint256 houseId) public view returns (uint256) {
        return metadata[tokenIdByHouseId(houseId)].marketValue;
    }

    function ownerOfHouse(uint256 houseId) public view returns (address) {
        uint256 tokenId = houseIdToTokenId[houseId];
        return ownerOf(tokenId);
    }

    function setMetadata(
        uint256 tokenId_,
        uint256 marketValue,
        uint8 riskScore
    ) public onlyRole(ADMIN_ROLE) {
        Metadata storage mdata = metadata[tokenId_];
        mdata.marketValue = marketValue;
        mdata.riskScore = riskScore;
    }

    function safeMint(
        address to,
        uint256 houseId,
        uint256 marketValue,
        uint8 riskScore,
        uint256 zipCode,
        int256 latitude,
        int256 longitude
    ) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        houseIdToTokenId[houseId] = tokenId;
        metadata[tokenId] = Metadata(
            houseId,
            marketValue,
            riskScore,
            zipCode,
            latitude,
            longitude
        );
        emit MintDeed(msg.sender, tokenId, houseId);
    }

    function tokenIdsByAddress(address addressToQuery)
        public
        view
        returns (uint256[] memory)
    {
        uint256 balance_ = balanceOf(addressToQuery);
        uint256[] memory tokenIds = new uint256[](balance_);
        for (uint256 i = 0; i < balance_; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(addressToQuery, i);
        }
        return tokenIds;
    }

    function transferDeed(
        uint256 tokenId,
        address from_,
        address to_,
        bytes memory sigOfSender,
        bytes memory sigOfReceiver
    ) external onlyRole(TRANSFER_ROLE) {
        require(
            from_ == recover(keccak256(abi.encodePacked(tokenId)), sigOfSender)
        );
        require(
            to_ == recover(keccak256(abi.encodePacked(tokenId)), sigOfReceiver)
        );
        _transfer(from_, to_, tokenId);
        emit TransferDeed(from_, to_, tokenId);
    }

    //hash is keccak256 hashed version of tokenId(as a string)
    function recover(bytes32 hash, bytes memory sig)
        public
        pure
        returns (address)
    {
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
