// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.0;

contract Pool is Ownable {
    IERC721 nftCtc;
    IERC20 tokenCtc;
    IERC20 stableToken;
    uint8 minPoolRisk;
    uint8 maxPoolRisk;
    uint8 entranceFeePerc;
    uint256 noOfHouses;
    uint8 inspectorPerCity;
    uint256 startTime;
    uint256 tokenSaleStart;
    bool canBuyTokens;

    mapping(uint256 => ClaimRequest) public claimRequests; // houseId -> Claim Request
    mapping(uint256 => address[]) internal zipCodeToInspectors;

    constructor(IERC721 _nftCtc, IERC20 _tokenCtc, IERC20 _stableToken, uint8 _minPoolRisk, uint8 _maxPoolRisk, 
    uint8 _entranceFeePerc, uint8 _inspectorPerCity){
        nftCtc = _nftCtc;
        tokenCtc = _tokenCtc;
        stableToken = _stableToken;
        minPoolRisk = _minPoolRisk;
        maxPoolRisk = _maxPoolRisk;
        entranceFeePerc = _entranceFeePerc;
        inspectorPerCity = _inspectorPerCity; 
        startTime = block.timestamp;
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

    function enterPool(uint256 houseId) external payable{
        require((block.timestamp - startTime) <= 30 days, "Insurance period has ended");
        require(msg.sender == nftCtc.ownerOf(houseId), "You are not the owner of the house");
        require(canEnterPool(houseId));
        uint256 enteranceFee = calcEntranceFee(houseId);
        stableToken.transferFrom(msg.sender, address(this), enteranceFee);
        noOfHouses++;
    }

    function canEnterPool(uint256 houseId) internal returns(bool){
        address houseOwner = nftCtc.ownerOf(houseId);
        require(msg.sender == houseOwner, "You are not the owner of this house");
        uint8 houseRisk = nftCtc.getRisk(houseId);
        uint256 housePrice = nftCtc.getPrice(houseId);
        uint8 noOfInspectors = nftCtc.getInspectors(houseId);
        require(noOfInspectors >= 3, "Not enough inspectors");
        require(houseRisk >= minPoolRisk && houseRisk <= maxPoolRisk, "House risk out of pool's boundaries");
        uint256 entranceFee = calcEntranceFee(housePrice);
        require(msg.value >= entranceFee);
        return true;
    }

    function calcEntranceFee(uint256 houseId) public view returns(uint256){
        uint8 houseRisk = nftCtc.getRisk(houseId);
        uint256 housePrice = nftCtc.getPrice(houseId);
        return houseRisk * housePrice / 100; // for now
    }

    function makeClaimRequest(uint256 houseId) external {
        require(claimRequests[houseId].houseId == 0, "Alreade has claim request!");
        address houseOwner = nftCtc.ownerOf(houseId);
        require(houseOwner == msg.sender, "You are not the owner of this house");
        ClaimRequest memory cr = ClaimRequest(houseId, RequestStatus.UNDETERMINED, 0, 0);
        claimRequests[houseId] = cr;
    }

    function voteClaimRequest(uint256 houseId, bool vote, uint256 zipcode) external {
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
                cr.status = RequestStatus.DENIED;
            }
            emit RequestVotingEnded(cr.grantVotes, cr.denyVotes);
        }
    }

    function addInspector(uint256 zipCode, address inspector) external onlyOwner{
        address[] storage inspectors = zipCodeToInspectors[zipCode];
        require(inspectors.length < inspectorPerCity, "Inspector limit reached for the city");
        inspectors.push(inspector);
    }

    function buyPoolPartially(uint8 percentage) external payable{
        require(canBuyTokens);
        uint256 price =  calculateTokenPrice(percentage, address(this).balance);
        require(msg.value == price, "Inadequate money for the percentage");
        tokenCtc.transferFrom(address(tokenCtc), msg.sender, percentage);
        tokenCtc.approve(address(this), percentage);
    }

    function claimInsuranceReward() external{

        uint8 ownedTokens = uint8(nftCtc.balanceOf(msg.sender));
        require(ownedTokens > 0, "You don't own any share of the pool");
        payable(msg.sender).transfer(address(this).balance * ownedTokens / 100);
        nftCtc.transferFrom(msg.sender, address(0), ownedTokens);
    }

    function calculateTokenPrice(uint8 percantage, uint256 poolVolume) internal returns(uint256){
        return 100;
    }

    function startTokenSale() external onlyOwner {
        require(block.timestamp - startTime >= 30 days, "Insurance period hasnt ended yet");
        canBuyTokens = true;
        tokenSaleStart = block.timestamp;
    }

}