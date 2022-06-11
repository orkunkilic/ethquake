// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
// import "hardhat/console.sol";
import "./DeedNFT.sol";
import "./Stake.sol";
import "./PoolToken.sol";

// FIXME: Add events!!!
// FIXME: Reorder functions according to access and context!!!

contract Pool is Ownable {
    using Strings for uint;

    DeedNFT nftCtc;
    IERC20 tokenCtc;
    IERC20 stableToken;
    Staking stakeCtc;
    uint8 public minPoolRisk;
    uint8 public maxPoolRisk;
    uint8 public entranceFeePerc;
    uint8 public inspectorPerCity;

    uint256 public startTime;
    uint256 public tokenSaleStart;
    bool public canBuyTokens;
    bool public canClaim;
    bool public canInsurerClaim;

    uint256 public totalAmountRegistered;
    uint256 public totalPriceHouseGranted;
    uint256 public remainingHousesGranted;
    // There are four time periods
    // 1. Pool house registration
    // 2. 1 year
    // 3. Calim for houses that are claimed.
    // 4. Collateral claim

    uint8 public soldPercentage;
    uint256 public totalPoolBalance;
    uint256 public totalSoldPoolBalance;

    uint256 public amountAtTheEnd;
    uint256 public amountLeftToInsurers;

    mapping(uint256 => ClaimRequest) public claimRequests; // tokenId -> Claim Request
    mapping(uint256 => address[]) internal zipCodeToInspectors;
    mapping(uint256 => bool) public housesInPool;

    constructor(
        DeedNFT _nftCtc,
        IERC20 _stableToken,
        uint8 _minPoolRisk,
        uint8 _maxPoolRisk,
        uint8 _entranceFeePerc,
        uint8 _inspectorPerCity,
        Staking _stakeCtc
    ) {
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

    enum RequestStatus {
        UNDETERMINED,
        GRANTED,
        DENIED,
        CLAIMED
    }

    struct ClaimRequest {
        uint256 tokenId;
        RequestStatus status;
        uint8 grantVotes;
        uint8 denyVotes;
        address[3] grantVoters;
        address[3] denyVoters;
    }

    function didInsurancePeriodEnd() public view returns (bool){ // FIXME: Weird name, use case?
        return (block.timestamp - startTime) > 30 days;
    }

    function enterPool(uint256 tokenId) external {
        require(
            (block.timestamp - startTime) <= 30 days,
            "Insurance period has ended"
        );
        require(
            msg.sender == nftCtc.ownerOfHouse(tokenId),
            "You are not the owner of this house"
        );
        uint8 houseRisk = nftCtc.getRisk(tokenId);
        uint8 noOfInspectors = uint8(
            zipCodeToInspectors[nftCtc.getZipcode(tokenId)].length
        );
        require(noOfInspectors >= 3, "Not enough inspectors");
        require(
            houseRisk >= minPoolRisk && houseRisk <= maxPoolRisk,
            "House risk out of pool's boundaries"
        );
        uint256 enteranceFee = calcEntranceFee(tokenId);
        stableToken.transferFrom(msg.sender, address(this), enteranceFee);
        totalPoolBalance += enteranceFee;
        totalAmountRegistered += nftCtc.getPrice(tokenId);
        housesInPool[tokenId] = true;
    }


    function calcEntranceFee(uint256 tokenId) public view returns (uint256) { // FIXME: Not working probably, also might be overflow?
        uint8 houseRisk = nftCtc.getRisk(tokenId);
        uint256 housePrice = nftCtc.getPrice(tokenId);
        return (houseRisk * housePrice) / 100;
    }

    function makeClaimRequest(uint256 tokenId) external { // FIXME: createClaimRequest ?
        require(housesInPool[tokenId], "House is not in pool");
        require(
            claimRequests[tokenId].tokenId == 0,
            "Already has claim request!"
        );
        address houseOwner = nftCtc.ownerOfHouse(tokenId);
        require(
            houseOwner == msg.sender,
            "You are not the owner of this house"
        );
        require(block.timestamp - startTime >= 30 days, "Insurance period has not started");
        ClaimRequest storage cr = claimRequests[tokenId];
        cr.tokenId = tokenId;
        cr.status = RequestStatus.UNDETERMINED;
    }

    function voteClaimRequest( // FIXME: voteforCla... ?
        uint256 tokenId,
        bool vote
    ) external {
        uint256 zipcode = nftCtc.getMetadata(tokenId).zipCode;
        address[] memory inspectorsOfCity = zipCodeToInspectors[zipcode];
        bool isInspector;
        for (uint8 i = 0; i < inspectorsOfCity.length; i++) {
            if (inspectorsOfCity[i] == msg.sender) {
                isInspector = true;
                break;
            }
        }
        require(isInspector, "You are not an inspector of the selected city");
        ClaimRequest storage cr = claimRequests[tokenId];
        require(cr.tokenId != 0, "Chosen house doesn't have any claim requests");
        if (vote) {
            cr.grantVoters[cr.grantVotes] = msg.sender;
            cr.grantVotes++;
        } else {
            cr.denyVoters[cr.denyVotes] = msg.sender;
            cr.denyVotes++;
        }
        if (cr.grantVotes + cr.denyVotes == inspectorPerCity) {
            if (cr.grantVotes > cr.denyVotes) {
                cr.status = RequestStatus.GRANTED;
                totalPriceHouseGranted += nftCtc.getPrice(cr.tokenId);
                //remainingHousesGranted += 1;
                if (cr.denyVotes == 1) { // FIXME: Is there a better way to do these?
                    stakeCtc.slashInspector(cr.denyVoters[0]);
                    stakeCtc.rewardInspector(cr.grantVoters[0]);
                    stakeCtc.rewardInspector(cr.grantVoters[1]);
                } else { // deny == 0
                    stakeCtc.rewardInspector(cr.grantVoters[0]);
                    stakeCtc.rewardInspector(cr.grantVoters[1]);
                    stakeCtc.rewardInspector(cr.grantVoters[2]);
                }
            } else {
                cr.status = RequestStatus.DENIED;
                if (cr.grantVotes == 1) {
                    stakeCtc.slashInspector(cr.grantVoters[0]);
                    stakeCtc.rewardInspector(cr.denyVoters[0]);
                    stakeCtc.rewardInspector(cr.denyVoters[1]);
                } else {
                    stakeCtc.rewardInspector(cr.denyVoters[0]);
                    stakeCtc.rewardInspector(cr.denyVoters[1]);
                    stakeCtc.rewardInspector(cr.denyVoters[2]);
                }
            }
            emit RequestVotingEnded(cr.grantVotes, cr.denyVotes);
        }
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return a <= b ? a : b;
    }

    function claimAsHouseOwner(uint256 tokenId) external { // FIXME: better name ?
        require(canClaim, "Can't claim yet. Insurance hasn't ended.");
        require(
            msg.sender == nftCtc.ownerOfHouse(tokenId),
            "You are not the owner of the house"
        );
        require(
            claimRequests[tokenId].status != RequestStatus.CLAIMED,
            "Your are already claimed."
        );
        require(
            claimRequests[tokenId].status == RequestStatus.GRANTED,
            "Your request hasn't been granted."
        );
        uint256 claimable = min(
            nftCtc.getPrice(tokenId) * amountAtTheEnd / totalPriceHouseGranted,
            nftCtc.getPrice(tokenId)
        );
        //totalAmountRegistered -= nftCtc.getPrice(tokenId); // why the fuck we are removing it?
        claimRequests[tokenId].status = RequestStatus.CLAIMED;
        stableToken.transfer(msg.sender, claimable);
        //housesInPool[tokenId] = false; // why the fuck we are removing house from pool?
    }

    function addInspector(uint256 zipCode, address inspector)
        external
        onlyOwner
    { // FIXME: check for duplicates?
        address[] storage inspectors = zipCodeToInspectors[zipCode];
        require(
            inspectors.length < inspectorPerCity,
            "Inspector limit reached for the city"
        );
        inspectors.push(inspector);
    }

    // each amount represents 1 / 100
    function buyPoolPartially(uint8 percentage) external { // FIXME: Test + better naming?
        require(canBuyTokens, "Cannot buy pool tokens yet!");
        require(percentage + soldPercentage <= 100, "Too much percentage");
        uint256 collateralPercentage = calculateCollateralAmount(); // returns 70
        // console.log(collateralPercentage);
        // console.log(totalPoolBalance);
        uint256 amountToTransfer = totalPoolBalance * collateralPercentage * percentage / 10000; // 100_000000 * 70 * 50 / 10000 = 35_000000 -> 35
        // console.log(amountToTransfer);
        // console.log("sold perc.", soldPercentage);
        stableToken.transferFrom(msg.sender, address(this), amountToTransfer);
        tokenCtc.transfer(msg.sender, percentage);
        soldPercentage += percentage;
    }

    function claimAsInsurer() external { // FIXME: better naming?
        require(canInsurerClaim, "Insurers can't claim yet.");
        uint8 ownedTokens = uint8(tokenCtc.balanceOf(msg.sender));
        require(ownedTokens > 0, "You don't own any share of the pool");
        uint256 claimable = amountLeftToInsurers * ownedTokens / 100; // 100 is the total supply
        tokenCtc.transferFrom(msg.sender, address(this), ownedTokens);
        stableToken.transferFrom(address(this), msg.sender, claimable);
    }

    function calculateCollateralAmount()
        internal view
        returns (uint256)
    {
        uint256 amount = (100 - maxPoolRisk); // 60
        uint256 month = (block.timestamp - startTime) / 30 days; // 2. ay
        uint256 extra = month * 5; // 10
        uint256 total = amount + extra; // 70

        return total;
    }

    function startTokenSale() external { // FIXME: start...Period ?
        require(
            block.timestamp - startTime >= 30 days,
            "Pool registry hasnt ended yet"
        );
        canBuyTokens = true;
        tokenSaleStart = block.timestamp;
        string memory name = string(abi.encodePacked("Pool-", startTime.toString()));
        tokenCtc = new PoolToken(name, name);
    }

    function endInsurancePeriod() external onlyOwner{ // claim period for pool is started
        // console.log("here");
        require( 
            block.timestamp - tokenSaleStart >= 365 days,
            "Insurance period hasnt ended yet"
        );
        canClaim = true;
        // console.log(canClaim);
        canBuyTokens = false;
        amountAtTheEnd = stableToken.balanceOf(address(this));
    }

    function endClaimPeriod() external onlyOwner{ // claim period for insurers is started
        require(
            block.timestamp - tokenSaleStart >= 395 days,
            "Insurance period hasnt ended yet"
        );
        canClaim = false;
        canInsurerClaim = true;
        stableToken.transfer(msg.sender, stableToken.balanceOf(address(this)) * 1 / 100); // fee
        amountLeftToInsurers = stableToken.balanceOf(address(this));
    } 

    // function demoEndPoolEntrance() external onlyOwner {
    //     startTime -= 31 days;
    // }

    // function demoEndInsurancePeriod() external onlyOwner {
    //     tokenSaleStart -= 400 days;
    // }

    function getPoolTokenAddress() public view returns(address){
        return address(tokenCtc);
    }

}
