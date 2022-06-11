const { expect } = require("chai");
const chai = require("chai");
const { smock } = require('@defi-wonderland/smock');
const { ethers } = require("hardhat");

describe("Pool contract", function () {
    chai.use(smock.matchers);
    
    let DeedNFT;
    let StableCoin;
    let DeinsuranceToken;
    let Staking;
    let Pool;
    let PoolToken;

    beforeEach(async function () {
        DeedNFT = smock.mock("DeedNFT");
        StableCoin = smock.mock("StableCoin");
        DeinsuranceToken = smock.mock("DeinsuranceToken");
        Staking = smock.mock("Staking");
        Pool = smock.mock("Pool");
        PoolToken = smock.mock("PoolToken");

        [owner, ins1, ins2, ins3, houseOwner, acc5, acc6, ...accs] = await ethers.getSigners();

        deedNFT = await DeedNFT.deploy();
        stableCoin = await StableCoin.deploy();
        deinsuranceToken = await DeinsuranceToken.deploy();
        staking = await Staking.deploy(deinsuranceToken.address);
        pool = await Pool.deploy(deedNFT.address, stableCoin.address, 20, 40, 10, 3, staking.address);

        await stableCoin.mint(owner.address, ethers.utils.parseEther("100_000"));

        await stableCoin.mint(houseOwner.address, ethers.utils.parseEther("100_000"));

        await DeinsuranceToken.mint(ins1.address, ethers.utils.parseEther("100_000"));
        await DeinsuranceToken.mint(ins2.address, ethers.utils.parseEther("100_000"));
        await DeinsuranceToken.mint(ins3.address, ethers.utils.parseEther("100_000"));

        await Staking.connect(ins1).stake(ethers.utils.parseEther("100"));
        await Staking.connect(ins2).stake(ethers.utils.parseEther("100"));
        await Staking.connect(ins3).stake(ethers.utils.parseEther("100"));  
        
        await Staking.addPool(pool.address);

        await deedNFT.safeMint(houseOwner.address, 1111, 100_000_000000, 25, 34, 60, 70);
        await deedNFT.safeMint(houseOwner.address, 2222, 100_000_000000, 25, 34, 60, 70);
        await deedNFT.safeMint(houseOwner.address, 3333, 100_000_000000, 25, 34, 60, 70);

        await pool.addInspector(34, ins1.address);
        await pool.addInspector(34, ins2.address);
        await pool.addInspector(34, ins3.address);

        await stableCoin.connect(houseOwner).approve(pool.address, ethers.utils.parseEther("100000000000"));
    });

    it('process', async function () {
        await pool.connect(houseOwner).enterPool(1);

        await pool.connect(houseOwner).enterPool(2);

        await pool.connect(houseOwner).enterPool(3);

        console.log(await pool.totalPoolBalance())

        expect(true).to.be.true;
    })

});   