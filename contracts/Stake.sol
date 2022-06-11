// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//import "./Pool.sol";

contract Staking is Ownable {
    IERC20 public token;

    mapping(address => bool) pools;
    mapping(address => StakeDetail) stakeDetails;

    uint256 public STAKE_AMOUNT = 10_000 * 10**18;

    struct StakeDetail {
        uint256 amountStaked;
        uint256 amountRewarded;
        uint256 amountSlashed;
        uint256 stakedAt;
    }

    constructor(address token_) {
        token = IERC20(token_);
    }

    function addPool(address pool) public onlyOwner {
        pools[pool] = true;
        token.approve(
            pool,
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        );
    }

    function stake(uint256 amount) public {
        require(amount >= STAKE_AMOUNT);
        require(amount <= token.balanceOf(msg.sender));
        require(
            stakeDetails[msg.sender].amountStaked == 0,
            "You already staked"
        );
        token.transferFrom(msg.sender, address(this), amount);
        StakeDetail memory stakeDetail = StakeDetail(
            amount,
            0,
            0,
            block.timestamp
        );
        stakeDetails[msg.sender] = stakeDetail;
    }

    function withdrawRewards() public {
        StakeDetail memory stakeDetail = stakeDetails[msg.sender];
        require(stakeDetail.amountStaked > 0, "You have not staked");
        stakeDetails[msg.sender].amountRewarded = 0;
        token.transferFrom(
            address(this),
            msg.sender,
            stakeDetail.amountRewarded
        );
    }

    function withdraw() public {
        StakeDetail memory stakeDetail = stakeDetails[msg.sender];
        require(stakeDetail.amountStaked > 0, "You have not staked");
        require(
            stakeDetail.stakedAt + (60 * 60 * 24 * 365) < block.timestamp,
            "You can withdraw only year after"
        );
        delete stakeDetails[msg.sender];
        token.transferFrom(
            address(this),
            msg.sender,
            (stakeDetail.amountStaked + stakeDetail.amountRewarded)
        );
    }

    function slashInspector(address inspector) public {
        require(pools[msg.sender], "Only pools can slash");
        require(
            stakeDetails[inspector].amountStaked > 0,
            "Inspector has not staked"
        );
        require(
            stakeDetails[inspector].amountSlashed + 100 <=
                stakeDetails[inspector].amountStaked,
            "Inspector has not enough stake to slash"
        );
        stakeDetails[inspector].amountSlashed += 100;
    }

    function rewardInspector(address inspector) public {
        require(pools[msg.sender], "Only pools can reward");
        require(
            stakeDetails[inspector].amountStaked > 0,
            "Inspector has not staked"
        );
        stakeDetails[inspector].amountRewarded += 100;
    }
}
