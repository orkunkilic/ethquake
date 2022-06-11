// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./DeedNFT.sol";
import "./Stake.sol";
import "./PoolToken.sol";



contract Pool is Ownable {
    using Strings for uint;

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
    bool canInsurerClaim;

    uint256 totalAmountRegistered;
    uint256 totalPriceHouseGranted;
    uint256 remainingHousesGranted;
    // There are four time periods
    // 1. Pool house registration
    // 2. 1 year
    // 3. Calim for houses that are claimed.
    // 4. Collateral claim

    uint8 soldPercentage;
    uint256 totalPoolBalance;
    uint256 totalSoldPoolBalance;

    uint256 amountAtTheEnd;
    uint256 amountLeftToInsurers;

    mapping(uint256 => ClaimRequest) public claimRequests; // houseId -> Claim Request
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
        uint256 houseId;
        RequestStatus status;
        uint8 grantVotes;
        uint8 denyVotes;
        address[3] grantVoters;
        address[3] denyVoters;
    }

    function enterPool(uint256 houseId) external {
        require(canEnterPool(houseId), "Can't enter the pool");
        uint256 enteranceFee = calcEntranceFee(houseId);
        stableToken.transferFrom(msg.sender, address(this), enteranceFee);
        totalPoolBalance += enteranceFee;
        totalAmountRegistered += nftCtc.getPrice(houseId);
        housesInPool[houseId] = true;
    }

    function canEnterPool(uint256 houseId) internal view returns (bool) {
        require(
            (block.timestamp - startTime) <= 30 days,
            "Insurance period has ended"
        );
        require(
            msg.sender == nftCtc.ownerOfHouse(houseId),
            "You are not the owner of this house"
        );
        uint8 houseRisk = nftCtc.getRisk(houseId);
        uint8 noOfInspectors = uint8(
            zipCodeToInspectors[nftCtc.getZipcode(houseId)].length
        );
        require(noOfInspectors >= 3, "Not enough inspectors");
        require(
            houseRisk >= minPoolRisk && houseRisk <= maxPoolRisk,
            "House risk out of pool's boundaries"
        );
        return true;
    }

    function calcEntranceFee(uint256 houseId) public view returns (uint256) {
        uint8 houseRisk = nftCtc.getRisk(houseId);
        uint256 housePrice = nftCtc.getPrice(houseId);
        return (houseRisk * housePrice) / 100; // for now
    }

    function makeClaimRequest(uint256 houseId) external {
        require(housesInPool[houseId], "House is not in pool");
        require(
            claimRequests[houseId].houseId == 0,
            "Already has claim request!"
        );
        address houseOwner = nftCtc.ownerOfHouse(houseId);
        require(
            houseOwner == msg.sender,
            "You are not the owner of this house"
        );
        require(block.timestamp - startTime >= 30 days);
        ClaimRequest storage cr = claimRequests[houseId];
        cr.houseId = houseId;
        cr.status = RequestStatus.UNDETERMINED;
    }

    function voteClaimRequest(
        uint256 houseId,
        bool vote
    ) external {
        uint256 zipcode = nftCtc.getMetadata(houseId).zipCode;
        address[] memory inspectorsOfCity = zipCodeToInspectors[zipcode];
        bool isInspector;
        for (uint8 i = 0; i < inspectorsOfCity.length; i++) {
            if (inspectorsOfCity[i] == msg.sender) {
                isInspector = true;
                break;
            }
        }
        require(isInspector, "You are not an inspector of the selected city");
        ClaimRequest storage cr = claimRequests[houseId];
        require(cr.houseId != 0, "Chosen house doesn't have any claim requests");
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
                totalPriceHouseGranted += nftCtc.getPrice(cr.houseId);
                //remainingHousesGranted += 1;
                if (cr.denyVotes == 1) {
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

    function claimAsHouseOwner(uint256 houseId) external {
        require(canClaim);
        require(
            msg.sender == nftCtc.ownerOfHouse(houseId),
            "You are not the owner of the house"
        );
        require(
            claimRequests[houseId].status != RequestStatus.CLAIMED,
            "Your are already claimed."
        );
        require(
            claimRequests[houseId].status == RequestStatus.GRANTED,
            "Your request hasn't been granted."
        );
        uint256 claimable = min(
            nftCtc.getPrice(houseId) * amountAtTheEnd / totalPriceHouseGranted,
            nftCtc.getPrice(houseId)
        );
        //totalAmountRegistered -= nftCtc.getPrice(houseId); // why the fuck we are removing it?
        claimRequests[houseId].status = RequestStatus.CLAIMED;
        stableToken.transferFrom(address(this), msg.sender, claimable);
        //housesInPool[houseId] = false; // why the fuck we are removing house from pool?
    }

    function addInspector(uint256 zipCode, address inspector)
        external
        onlyOwner
    {
        address[] storage inspectors = zipCodeToInspectors[zipCode];
        require(
            inspectors.length < inspectorPerCity,
            "Inspector limit reached for the city"
        );
        inspectors.push(inspector);
    }

    // each amount represents 1 / 100
    function buyPoolPartially(uint8 percentage) external { // Test!!
        require(canBuyTokens, "Cannot buy pool tokens yet!");
        require(percentage + soldPercentage <= 100, "Too much percentage");
        uint256 collateralPercentage = calculateCollateralAmount(); // returns 70
        uint256 amountToTransfer = totalPoolBalance * collateralPercentage * percentage / 10000; // 100_000000 * 70 * 50 / 10000 = 35_000000 -> 35
        stableToken.transferFrom(msg.sender, address(this), amountToTransfer);
        tokenCtc.transfer(msg.sender, percentage * 10 ** 18);
        soldPercentage += percentage;
    }

    function claimAsInsurer() external {
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

    function startTokenSale() external {
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
        require( 
            block.timestamp - tokenSaleStart >= 365 days,
            "Insurance period hasnt ended yet"
        );
        canClaim = true;
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

    function demoEndPoolEntrance() external onlyOwner {
        startTime -= 31 days;
    }

    function demoEndInsurancePeriod() external onlyOwner {
        startTime -= 400 days;
    }

}
