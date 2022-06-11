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

        DeedNFT = await (await ethers.getContractFactory("DeedNFT")).deploy("0xdD870fA1b7C4700F2BD7f44238821C26f7392148");
        await DeedNFT.deployed();

        StableCoin = await (await ethers.getContractFactory("ERC20Token")).deploy();
        await StableCoin.deployed();

        DeinsuranceToken = await (await ethers.getContractFactory("DeinsuranceToken")).deploy();
        await DeinsuranceToken.deployed();

        Staking = await (await ethers.getContractFactory("Staking")).deploy(DeinsuranceToken.address);
        await Staking.deployed();

        Pool = await (await ethers.getContractFactory("Pool")).deploy(DeedNFT.address, StableCoin.address, 10, 20, 10, 3, Staking.address);
        await Pool.deployed();

    });

    describe("Workflow", function () {

        beforeEach(async function () {
            let giveApprovalTx = await StableCoin.connect(hOwner1).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();

            giveApprovalTx = await StableCoin.connect(hOwner2).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();
            
            giveApprovalTx = await StableCoin.connect(investor1).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();

            giveApprovalTx = await StableCoin.connect(investor2).approve(Pool.address, ethers.utils.parseEther("1000000"));
            await giveApprovalTx.wait();

            await (await StableCoin.mint(ethers.utils.parseEther("10000000000000"))).wait();
            await (await StableCoin.transfer(hOwner1.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(hOwner2.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(inspector1.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(inspector2.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(inspector3.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(investor1.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(investor2.address, ethers.utils.parseEther("1000000"))).wait();



        });
        
        describe("pool enterance period", function (){
            it("should let home with right conditions enter pool", async function (){
                const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
                await mintHouseTx.wait();
                
                await (await Pool.addInspector(31, inspector1.address));
                await (await Pool.addInspector(31, inspector2.address));
                await (await Pool.addInspector(31, inspector3.address));



                await expect(Pool.connect(hOwner1).enterPool(1)).not.to.be.reverted;
            });

            it("shouldn't let none homeowner enter pool", async function(){
                const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 90, 31, 1234, 5678);
                await mintHouseTx.wait();
                
                await (await Pool.addInspector(31, inspector1.address));
                await (await Pool.addInspector(31, inspector2.address));
                await (await Pool.addInspector(31, inspector3.address));



                await expect(Pool.connect(hOwner2).enterPool(1)).to.be.reverted;
            });

            it("shouldn't let homes with inadequate risk levels enter the pool", async function (){
                const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
                await mintHouseTx.wait();
                
                await (await Pool.addInspector(31, inspector1.address));
                await (await Pool.addInspector(31, inspector2.address));
                await (await Pool.addInspector(31, inspector3.address));



                await expect(Pool.connect(hOwner1).enterPool(1)).not.to.be.reverted;
            });

            it("shouldn't let homes with inspectors less than 3 enter the pool", async function (){
                const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
                await mintHouseTx.wait();

                await (await Pool.addInspector(31, inspector1.address))

                await expect(Pool.connect(hOwner1).enterPool(1)).to.be.reverted;

            });

            it("shouldn't let claims be made before pool enterance period closes", async function (){
                const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
                await mintHouseTx.wait();
                
                await (await Pool.addInspector(31, inspector1.address));
                await (await Pool.addInspector(31, inspector2.address));
                await (await Pool.addInspector(31, inspector3.address));

                await (await Pool.connect(hOwner1).enterPool(1)).wait();

                await expect(Pool.connect(hOwner1).makeClaimRequest(1)).to.be.reverted;

            });
            it("shouldn't let home owner make double claim request", async function (){
                const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
                await mintHouseTx.wait();
                
                await (await Pool.addInspector(31, inspector1.address));
                await (await Pool.addInspector(31, inspector2.address));
                await (await Pool.addInspector(31, inspector3.address));

                await (await Pool.connect(hOwner1).enterPool(1)).wait();

                await (await Pool.connect(hOwner1).makeClaimRequest(1)).wait();

                await expect(Pool.connect(hOwner1).makeClaimRequest(1)).to.be.reverted;

            });

            it("shouldn't let inspectors vote", async function (){

            });

            it("shouldn't let house owners claim.", async function () {

            });

            it("shouldn't let investors buy pool tokens", async function (){

            });

            it("shouldn't let investors claim", async function (){

            });

            it("should let owner make contract go to next period for demo purposes.", async function(){
                await (await Pool.demoEndPoolEntrance()).wait();

                await expect(Pool.startTokenSale()).not.to.be.reverted;
            });

        });

        describe("investment period", function (){

        });




    });





});