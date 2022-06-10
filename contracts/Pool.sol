// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

pragma solidity ^0.8.0;

contract Pool is Ownable {
    IERC721 nftCtc;
    IERC20 tokenCtc;
    uint8 minPoolRisk;
    uint8 maxPoolRisk;
    uint8 entranceFeePerc;
    uint256 noOfHouses;
    uint8 inspectorPerCity;

    mapping(uint256 => ClaimRequest) public claimRequests; // houseId -> Claim Request
    mapping(uint256 => address[]) internal zipCodeToInspectors;

    constructor(IERC721 _nftCtc, IERC20 _tokenCtc, uint8 _minPoolRisk, uint8 _maxPoolRisk, 
    uint8 _entranceFeePerc, _inspectorPerCity){
        nftCtc = _nftCtc;
        tokenCtc = _tokenCtc;
        minPoolRisk = _minPoolRisk;
        maxPoolRisk = _maxPoolRisk;
        entranceFeePerc = _entranceFeePerc;
        inspectorPerCity = _inspectorPerCity; 
    }

    event RequestVotingEnded(uint8 grants, uint8 denies);

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
        require(claimRequests[houseId].houseId == 0, "Alreade has claim request!");
        address houseOwner = nftCtc.ownerOf(houseId);
        require(houseOwner == msg.sender, "You are not the owner of this house");
        ClaimRequest memory cr = ClaimRequest(houseId, RequestStatus.UNDETERMINED, 0, 0);
        claimRequests[houseId] = cr;
    }

    function voteClaimRequest(uint256 houseId, bool vote, uint256 zipcode) external onlyInspector{
        address[] memory inspectorsOfCity = zipCodeToInspectors[zipcode];
        bool isInspector;
        for(uint8 i = 0; i < inspectorsOfCity.length; i++){
            if(inspectorsOfCity[i] == msg.sender){
                isInspector = true;
                break;
            }
        }
        require(isInspector, "You are not an inspector of the selected city");
        ClaimRequest storage cr = claimRequests[houseId];
        if(vote){
            cr.grantVotes++;
        } else {
            cr.denyVotes++;
        }
        if(cr.grantVotes + cr.denyVotes == inspectorPerCity){
            if(cr.grantVotes > cr.denyVotes){
                cr.status = RequestStatus.GRANTED;
            } else{
                cr.status = RequestStatus.GRANTED;
            }
            emit RequestVotingEnded(cr.grantVotes, cr.denyVotes);
        }
    }

    function addInspector(uint256 zipCode, address inspector) external onlyOwner{
        address[] storage inspectors = zipCodeToInspectors[zipCode];
        require(inspectors.length < inspectorPerCity, "Inspector limit reached for the city");
        inspectors.push(inspector);
    }

    function buyPoolPartially(uint8) external payable{

    }

    function claimInsuranceReward() external{
        uint8 ownedTokens = nftCtc.balanceOf(msg.sender);
        require(ownedTokens > 0, "You don't own any share of the pool");
        transfer(address(balance) * ownedTokens / 100).to(msg.sender);
        // burn tokens
    }

}