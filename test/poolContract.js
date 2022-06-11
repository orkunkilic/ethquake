const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pool Contract", function (){
    let cOwner, hOwner1, hOwner2, inspector1, inspector2, inspector3, investor1, investor2;
    let DeedNFT;
    let StableCoin;
    let DeinsuranceToken;
    let Staking;
    let Pool;

    beforeEach(async function (){
        [cOwner, hOwner1, hOwner2, inspector1, inspector2, inspector3, investor1, investor2] = await ethers.getSigners();

        DeedNFT = await ethers.getContractFactory("DeedNFT").deploy("0xdD870fA1b7C4700F2BD7f44238821C26f7392148");
        await DeedNFT.deployed();

        StableCoin = await (await ethers.getContractFactory("ERC20Token")).deploy();
        await StableCoin.deployed();

        DeinsuranceToken = await (await ethers.getContractFactory("DeinsuranceToken")).deploy();
        await DeinsuranceToken.deployed();

        Staking = await (await ethers.getContractFactory("Staking")).deploy(DeinsuranceToken.address);
        await Staking.deployed();

        Pool = await (await ethers.getContractFactory("Pool")).deploy();
        await Pool.deployed();

    });

    desccribe("Workflow", function () {

        beforeEach(async function () {
            let giveApprovalTx = await StableCoin.connect(hOwner1).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();

            giveApprovalTx = await StableCoin.connect(hOwner2).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();
            
            giveApprovalTx = await StableCoin.connect(investor1).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();

            giveApprovalTx = await StableCoin.connect(investor2).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();

        });
        
        describe("pool enterance period", function (){
            it("should let homeowner enter pool", async function (){

            });

            it("shouldn't let none homeowner enter pool", async function(){

            });

            it("shouldn't let homes with inadequate risk levels enter the pool", async function (){

            });

            it("shouldn't let homes with inspectors less than 3 enter the pool", async function (){

            });

            it("shouldn't let claims be made before pool enterance period closes", async function (){

            });

            it("shouldn't let inspectors vote", async function (){

            });

            it("shouldn't let house owners claim.", async function () {

            });

            it("shouldn't let investors buy pool tokens", async function (){

            });

            it("shouldn't let investors claim", async function (){

            });

        });

        describe("investment period", function (){

        });




    });





});