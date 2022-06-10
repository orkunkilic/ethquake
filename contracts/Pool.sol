// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

pragma solidity ^0.8.0;

contract Pool is Ownable {
    IERC721 nftCtc;
    uint8 minPoolRisk;
    uint8 maxPoolRisk;
    uint8 entranceFeePerc;
    uint256 noOfHouses;
    uint256 noOfClaimRequests;

    mapping(uint256 => ClaimRequest) public claimRequests; // houseId -> Claim Request
    mapping(uint256 => address[]) internal zipCodeToInspectors;

    constructor(IERC721 _nftCtc, uint8 _minPoolRisk, uint8 _maxPoolRisk, uint8 _entranceFeePerc){
        nftCtc = _nftCtc;
        minPoolRisk = _minPoolRisk;
        maxPoolRisk = _maxPoolRisk;
        _entranceFeePerc = _entranceFeePerc;
    }

    modifier onlyInspector{

    }

    enum RequestStatus{
        UNDETERMINED,
        GRANTED,
        DENIED
    }

    struct ClaimRequest{
        uint256 houseId;
        RequestStatus status;
        uint8 grantVotes;
        uint8 denyVotes;
    }

    function enterPool(uint8 houseRisk, uint256 housePrice) external payable{
        require(canEnterPool(houseRisk, housePrice));
        noOfHouses++;
    }

    function canEnterPool(uint8 houseRisk, uint256 housePrice) internal returns(bool){
        require(houseRisk >= minPoolRisk && houseRisk <= maxPoolRisk, "House risk out of pool's boundaries");
        uint256 entranceFee = calcEntranceFee(housePrice);
        require(msg.value >= entranceFee);
        return true;
    }

    function calcEntranceFee(uint256 housePrice) public returns(uint256){
        return housePrice * uint256(entranceFeePerc);
    }

    function makeClaimRequest(uint256 houseId) external {
        address houseOwner = nftCtc.ownerOf(houseId);
        require(houseOwner == msg.sender, "You are not the owner of this house");
        noOfClaimRequests++;
        ClaimRequest memory cr = ClaimRequest(houseId, RequestStatus.UNDETERMINED, 0, 0);
        claimRequests[noOfClaimRequests] = cr;
    }

    function voteClaimRequest(bool vote) external onlyInspector{

    }


}