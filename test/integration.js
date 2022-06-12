const { expect } = require("chai");
const chai = require("chai");
const { smock } = require('@defi-wonderland/smock');
const { ethers } = require("hardhat");

describe("Pool contract - integration", function () {
    chai.use(smock.matchers);
    
    let DeedNFT;
    let StableCoin;
    let DeinsuranceToken;
    let Staking;
    let Pool;
    let PoolToken;
    let APIConsumer;

    beforeEach(async function () {
        [owner, ins1, ins2, ins3, houseOwner, acc5, acc6, ...accs] = await ethers.getSigners();

        DeedNFT = await smock.mock("DeedNFT");
        StableCoin = await smock.mock("StableCoin");
        DeinsuranceToken = await smock.mock("DeinsuranceToken");
        Staking = await smock.mock("Staking");
        Pool = await smock.mock("Pool");
        PoolToken = await smock.mock("PoolToken");
        APIConsumer = await smock.mock("APIConsumer");

        deedNFT = await DeedNFT.deploy();
        stableCoin = await StableCoin.deploy();
        deinsuranceToken = await DeinsuranceToken.deploy();
        staking = await Staking.deploy(deinsuranceToken.address);
        apiConsumer = await APIConsumer.deploy();
        pool = await Pool.deploy(deedNFT.address, stableCoin.address, 20, 40, 100, 3, staking.address, apiConsumer.address);

        await stableCoin.mint(owner.address, ethers.utils.parseEther("100000"));

        await stableCoin.mint(houseOwner.address, ethers.utils.parseEther("100000"));

        await deinsuranceToken.mint(ins1.address, ethers.utils.parseEther("100000"));
        await deinsuranceToken.mint(ins2.address, ethers.utils.parseEther("100000"));
        await deinsuranceToken.mint(ins3.address, ethers.utils.parseEther("100000"));

        await deinsuranceToken.connect(ins1).approve(staking.address, ethers.utils.parseEther("100000"));
        await deinsuranceToken.connect(ins2).approve(staking.address, ethers.utils.parseEther("100000"));
        await deinsuranceToken.connect(ins3).approve(staking.address, ethers.utils.parseEther("100000"));

        await staking.connect(ins1).stake(ethers.utils.parseEther("100"));
        await staking.connect(ins2).stake(ethers.utils.parseEther("100"));
        await staking.connect(ins3).stake(ethers.utils.parseEther("100"));  
        
        await staking.addPool(pool.address);

        await deedNFT.safeMint(houseOwner.address, 1111, 100_000000, 25, 34, 60, 70);
        await deedNFT.safeMint(houseOwner.address, 2222, 100_000000, 25, 34, 60, 70);
        await deedNFT.safeMint(houseOwner.address, 3333, 100_000000, 25, 34, 60, 70);

        await pool.addInspector(34, ins1.address);
        await pool.addInspector(34, ins2.address);
        await pool.addInspector(34, ins3.address);

        await stableCoin.connect(houseOwner).approve(pool.address, ethers.utils.parseEther("100000000000"));


    });

    it('should claim and succeed', async function () {
        await pool.connect(houseOwner).enterPool(1);

        await pool.connect(houseOwner).enterPool(2);

        await pool.connect(houseOwner).enterPool(3);

        //await pool.connect(houseOwner).makeClaimRequest(1); // error

        await pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);

        await pool.connect(houseOwner).makeClaimRequest(1);

        console.log(await pool.connect(houseOwner).claimRequests(1));

        await pool.connect(ins1).voteForClaimRequest(1, true);
        await pool.connect(ins2).voteForClaimRequest(1, true);
        await pool.connect(ins3).voteForClaimRequest(1, false);

        console.log(await pool.connect(houseOwner).claimRequests(1));
        console.log(await staking.stakeDetails(ins1.address));
        console.log(await staking.stakeDetails(ins2.address));
        console.log(await staking.stakeDetails(ins3.address));

        //await pool.connect(houseOwner).claimAsHouseOwner(1); // error as it is not ended yet!

        await pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 396]);

        await pool.endInsurancePeriod();

        console.log(await pool.amountAtTheEnd());
        console.log(await stableCoin.balanceOf(pool.address));

        await pool.connect(houseOwner).claimFundsForHouseOwner(1); 

        console.log(await stableCoin.balanceOf(pool.address));
        
        expect(true).to.be.true;
    })

});   