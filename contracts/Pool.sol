// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./DeedNFT.sol";
import "./Stake.sol";

pragma solidity ^0.8.0;



contract PoolToken is ERC20 {
    constructor() ERC20("Pool 1", "P1") {
        _mint(msg.sender, 100);
    }
}

contract Pool is Ownable {
    DeedNFT nftCtc;
    IERC20 tokenCtc;
    IERC20 stableToken;
    Staking stakeCtc;
    uint8 minPoolRisk;
    uint8 maxPoolRisk;
    uint8 entranceFeePerc;
    uint8 inspectorPerCity;
    uint256 startTime;
    uint256 tokenSaleStart;
    bool canBuyTokens;
    bool canClaim;
    uint256 totalAmountRegistered;
    uint256 totalPriceHouseGranted;
    uint256 remainingHousesGranted;
    // There are four time periods
    // 1. Pool house registration
    // 2. 1 year
    // 3. Calim for houses that are claimed.
    // 4. Collateral claim

    mapping(uint256 => ClaimRequest) public claimRequests; // houseId -> Claim Request
    mapping(uint256 => address[]) internal zipCodeToInspectors;
    mapping(uint256 => bool) public housesInPool; 

    constructor(DeedNFT _nftCtc, IERC20 _stableToken, uint8 _minPoolRisk, uint8 _maxPoolRisk, 
    uint8 _entranceFeePerc, uint8 _inspectorPerCity, Staking _stakeCtc){
        nftCtc = _nftCtc;
        // tokenCtc = _tokenCtc;
        stableToken = _stableToken;
        minPoolRisk = _minPoolRisk;
        maxPoolRisk = _maxPoolRisk;
        entranceFeePerc = _entranceFeePerc;
        inspectorPerCity = _inspectorPerCity; 
        startTime = block.timestamp;
        stakeCtc = _stakeCtc;
    }

    event RequestVotingEnded(uint8 grants, uint8 denies);

    enum RequestStatus{
        UNDETERMINED,
        GRANTED,
        DENIED,
        CLAIMED
    }

    struct ClaimRequest{
        uint256 houseId;
        RequestStatus status;
        uint8 grantVotes;
        uint8 denyVotes;
        address[3] grantVoters;
        address[3] denyVoters;
    }

    function enterPool(uint256 houseId) external{
        require(canEnterPool(houseId));
        uint256 enteranceFee = calcEntranceFee(houseId);
        stableToken.transferFrom(msg.sender, address(this), enteranceFee);
        totalAmountRegistered += nftCtc.getPrice(houseId);
        housesInPool[houseId] = true;
    }

    function canEnterPool(uint256 houseId) internal returns(bool){
        require((block.timestamp - startTime) <= 30 days, "Insurance period has ended");
        require(msg.sender == nftCtc.ownerOf(houseId), "You are not the owner of this house");
        uint8 houseRisk = nftCtc.getRisk(houseId);
        uint256 housePrice = nftCtc.getPrice(houseId);
        uint8 noOfInspectors = uint8(zipCodeToInspectors[nftCtc.getZipCode(houseId)].length);
        require(noOfInspectors >= 3, "Not enough inspectors");
        require(houseRisk >= minPoolRisk && houseRisk <= maxPoolRisk, "House risk out of pool's boundaries");
        return true;
    }

    function calcEntranceFee(uint256 houseId) public view returns(uint256){
        uint8 houseRisk = nftCtc.getRisk(houseId);
        uint256 housePrice = nftCtc.getPrice(houseId);
        return houseRisk * housePrice / 100; // for now
    }

    function makeClaimRequest(uint256 houseId) external {
        require(housesInPool[houseId], "House is not in pool");
        require(claimRequests[houseId].houseId == 0, "Already has claim request!");
        address houseOwner = nftCtc.ownerOf(houseId);
        require(houseOwner == msg.sender, "You are not the owner of this house");
        ClaimRequest storage cr = claimRequests[houseId];
        cr.houseId = houseId;
        cr.status = RequestStatus.UNDETERMINED;
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
            cr.grantVoters[cr.grantVotes] = msg.sender;
            cr.grantVotes++;
        } else {
            cr.denyVoters[cr.denyVotes] = msg.sender;
            cr.denyVotes++;
        }
        if(cr.grantVotes + cr.denyVotes == inspectorPerCity){
            if(cr.grantVotes > cr.denyVotes){
                cr.status = RequestStatus.GRANTED;
                totalPriceHouseGranted += nftCtc.getPrice(cr.houseId);
                remainingHousesGranted += 1;
                if(cr.denyVotes == 1){
                    stakeCtc.slashInspector(cr.denyVotes[0]);
                }
            } else{
                cr.status = RequestStatus.DENIED;
                if(cr.grantvotes == 1){
                    stakeCtc.rewardInspector(cr.grantVotes[0]);
                }
            }
            emit RequestVotingEnded(cr.grantVotes, cr.denyVotes);
        }
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return a <= b ? a : b;
    }

    function claimAsHouseOwner(uint256 houseId) external {
        require(canClaim);
        require(remainingHousesGranted > 0, "Houses can not be claimed anymore");
        require(msg.sender == nftCtc.ownerOf(houseId), "You are not the owner of the house");
        require(claimRequests[houseId].status == RequestStatus.GRANTED, "Your request hasn't been granted.");
        claimRequests[houseId].status = RequestStatus.CLAIMED;

        uint256 claimable = min(nftCtc.getPrice(houseId) * stableToken.balanceOf(address(this)) / totalPriceHouseGranted, nftCtc.getPrice(houseId));
        totalAmountRegistered -= nftCtc.getPrice(houseId);
        stableToken.transferFrom(address(this), msg.sender, claimable);
        housesInPool[houseId] = false;
        remainingHousesGranted -= 1;
    }

    function addInspector(uint256 zipCode, address inspector) external onlyOwner{
        address[] storage inspectors = zipCodeToInspectors[zipCode];
        require(inspectors.length < inspectorPerCity, "Inspector limit reached for the city");
        inspectors.push(inspector);
    }
    // each amount represents 1 / 100
    function buyPoolPartially(uint8 amount) external payable{
        require(canBuyTokens);
        uint256 price =  calculateTokenPrice(amount, totalAmountRegistered);
        stableToken.transferFrom(msg.sender, address(this), price * amount);
        tokenCtc.transferFrom(address(tokenCtc), msg.sender, amount);
    }

    function claimAsInsurer() external{
        require(canClaim, "Insurers can't claim yet.");
        require(remainingHousesGranted == 0 || block.timestamp - tokenSaleStart >= 395 days, "Insurers can't claim yet.");

        uint8 ownedTokens = uint8(tokenCtc.balanceOf(msg.sender));
        require(ownedTokens > 0, "You don't own any share of the pool");
        uint256 claimable = stableToken.balanceOf(address(this)) * ownedTokens / 100;
        tokenCtc.transferFrom(msg.sender, address(0), ownedTokens);
        stableToken.transferFrom(address(this), msg.sender, claimable);
    }

    function calculateTokenPrice(uint8 percantage, uint256 initalPoolVolume) internal returns(uint256){
        return 100;
    }

    function startTokenSale() external {
        require(block.timestamp - startTime >= 30 days, "Pool registry hasnt ended yet");
        canBuyTokens = true;
        tokenSaleStart = block.timestamp;
        tokenCtc = new PoolToken();
    }

    function endInsurance() external {
        require(block.timestamp - tokenSaleStart >= 365 days, "Insurance period hasnt ended yet");
        canClaim = true;
        canBuyTokens = false;
    }

}