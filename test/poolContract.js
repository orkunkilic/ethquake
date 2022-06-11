const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pool Contract", function (){
    let cOwner, hOwner1, hOwner2, inspector1, inspector2, inspector3, investor1, investor2;
    let DeedNFT;
    let StableCoin;
    let DeinsuranceToken;
    let Staking;
    let Pool;
    let PoolToken;

    beforeEach(async function (){
        [cOwner, hOwner1, hOwner2, inspector1, inspector2, inspector3, investor1, investor2] = await ethers.getSigners();

        DeedNFT = await (await ethers.getContractFactory("DeedNFT")).deploy();
        await DeedNFT.deployed();

        StableCoin = await (await ethers.getContractFactory("StableCoin")).deploy();
        await StableCoin.deployed();

        DeinsuranceToken = await (await ethers.getContractFactory("DeinsuranceToken")).deploy();
        await DeinsuranceToken.deployed();

        Staking = await (await ethers.getContractFactory("Staking")).deploy(DeinsuranceToken.address);
        await Staking.deployed();


        Pool = await (await ethers.getContractFactory("Pool")).deploy(DeedNFT.address, StableCoin.address, 10, 20, 10, 3, Staking.address);
        await Pool.deployed();

        await (await Staking.addPool(Pool.address)).wait();


        let giveApprovalTx = await StableCoin.connect(hOwner1).approve(Pool.address, ethers.utils.parseEther("99999999999999"));
        await giveApprovalTx.wait();

        giveApprovalTx = await StableCoin.connect(hOwner2).approve(Pool.address, ethers.utils.parseEther("99999999999999"));
        await giveApprovalTx.wait();
        
        giveApprovalTx = await StableCoin.connect(investor1).approve(Pool.address, ethers.utils.parseEther("99999999999999"));
        await giveApprovalTx.wait();

        giveApprovalTx = await StableCoin.connect(investor2).approve(Pool.address, ethers.utils.parseEther("99999999999999"));
        await giveApprovalTx.wait();

        await (DeinsuranceToken.connect(inspector1).approve(Staking.address, ethers.utils.parseEther("99999999999999")));
        await (DeinsuranceToken.connect(inspector2).approve(Staking.address, ethers.utils.parseEther("99999999999999")));
        await (DeinsuranceToken.connect(inspector3).approve(Staking.address, ethers.utils.parseEther("99999999999999")));


    });

    describe("Workflow", function () {

        beforeEach(async function () {
            // await (await StableCoin.mint(ethers.utils.parseEther("1000000000000000"))).wait();
            await (await StableCoin.transfer(hOwner1.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(hOwner2.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(inspector1.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(inspector2.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(inspector3.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(investor1.address, ethers.utils.parseEther("1000000"))).wait();
            await (await StableCoin.transfer(investor2.address, ethers.utils.parseEther("1000000"))).wait();

            await (await DeinsuranceToken.transfer(Staking.address, ethers.utils.parseEther("97000")));

            await (await DeinsuranceToken.transfer(inspector1.address, ethers.utils.parseEther("1000")));
            await (await DeinsuranceToken.transfer(inspector2.address, ethers.utils.parseEther("1000")));
            await (await DeinsuranceToken.transfer(inspector3.address, ethers.utils.parseEther("1000")));



            await (await Staking.connect(inspector1).stake(ethers.utils.parseEther("1000")));
            await (await Staking.connect(inspector2).stake(ethers.utils.parseEther("1000")));
            await (await Staking.connect(inspector3).stake(ethers.utils.parseEther("1000")));


            const mintHouseTx = await DeedNFT.safeMint(hOwner1.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
            await mintHouseTx.wait();
            
            await (await Pool.addInspector(31, inspector1.address));
            await (await Pool.addInspector(31, inspector2.address));
            await (await Pool.addInspector(31, inspector3.address));

        });
        
        describe("pool enterance period", function (){
            it("should let home with right conditions enter pool", async function (){
                await expect(Pool.connect(hOwner1).enterPool(1)).not.to.be.reverted;
                expect(await Pool.housesInPool(1)).to.be.equal(true);
            });

            it("shouldn't let none homeowner enter pool", async function(){
                await expect(Pool.connect(hOwner2).enterPool(1)).to.be.reverted;
                expect(await Pool.housesInPool(1)).to.be.equal(false);

            });

            it("shouldn't let homes with inadequate risk levels enter the pool", async function (){
                await (await DeedNFT.safeMint(hOwner2.address, 2, ethers.utils.parseEther("100000"), 90, 42, 1234, 5678)).wait();
                
                await (await Pool.addInspector(42, inspector1.address));
                await (await Pool.addInspector(42, inspector2.address));
                await (await Pool.addInspector(42, inspector3.address));



                await expect(Pool.connect(hOwner2).enterPool(2)).to.be.reverted;
                expect(await Pool.housesInPool(2)).to.be.equal(false);

            });

            it("shouldn't let homes with inspectors less than 3 enter the pool", async function (){
                await (await DeedNFT.safeMint(hOwner2.address, 2, ethers.utils.parseEther("100000"), 15, 42, 1234, 5678)).wait();
                
                await (await Pool.addInspector(42, inspector1.address));

                await expect(Pool.connect(hOwner2).enterPool(2)).to.be.reverted;
                expect(await Pool.housesInPool(2)).to.be.equal(false);
            });

            it("shouldn't let claims be made before pool enterance period closes", async function (){
                await (await Pool.connect(hOwner1).enterPool(1)).wait();

                await expect(Pool.connect(hOwner1).makeClaimRequest(1)).to.be.reverted;
                expect((await Pool.claimRequests(1)).tokenId).to.be.equal(0);
            });

            it("shouldn't let inspectors vote", async function (){
                await (await Pool.connect(hOwner1).enterPool(1)).wait();

                await expect(Pool.connect(inspector1).voteClaimRequest(1, true, 31)).to.be.reverted;
                
                var claimReq = await Pool.claimRequests(1);
                expect(claimReq.denyVotes + claimReq.grantVotes).to.be.equal(0);
            });

            it("shouldn't let house owners claim 'reward'.", async function () {
                await (await Pool.connect(hOwner1).enterPool(1)).wait();
                var oldBalance = await StableCoin.balanceOf(hOwner1.address);
                await expect(Pool.connect(hOwner1).claimAsHouseOwner(1)).to.be.reverted;
                var newBalance = await StableCoin.balanceOf(hOwner1.address);
                expect(newBalance).to.be.equal(oldBalance);
            });

            it("shouldn't let investors buy pool tokens", async function (){
                await expect(Pool.connect(investor1).buyPoolPartially(10)).to.be.reverted;
            });

            it("shouldn't let investors claim", async function (){
                var oldBalance = await StableCoin.balanceOf(investor1.address);
                await expect(Pool.connect(investor1).claimAsInsurer()).to.be.reverted;
                var newBalance = await StableCoin.balanceOf(investor1.address);
                expect(newBalance).to.be.equal(oldBalance);
            });

            it("should let owner make contract go to next period for demo purposes.", async function(){
                // await (await Pool.demoEndPoolEntrance()).wait();
                await Pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);

                await expect(Pool.startTokenSale()).not.to.be.reverted;
                expect(await Pool.canBuyTokens()).to.be.equal(true);
            });

        });


        describe("pool entrance closed.", function (){
            beforeEach(async function (){
                await (await Pool.connect(hOwner1).enterPool(1)).wait();
                // await (await Pool.demoEndPoolEntrance()).wait();
                await Pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);
                await (await Pool.startTokenSale()).wait();

                await (await StableCoin.transfer(investor1.address, ethers.utils.parseEther("1000000000000"))).wait();
                await (await StableCoin.transfer(investor2.address, ethers.utils.parseEther("1000000000000"))).wait();

                PoolToken = await ethers.getContractAt("PoolToken", await Pool.getPoolTokenAddress());

            });

            describe("investors", function(){
                it("should let investors buy pool tokens", async function (){
                    await (await Pool.connect(investor1).buyPoolPartially(50)).wait();
                    await (await Pool.connect(investor2).buyPoolPartially(50)).wait();
                    var balance = await PoolToken.balanceOf(investor1.address);
                    var balance2 = await PoolToken.balanceOf(investor2.address);
                    expect(balance).to.be.equal(50);
                    expect(balance2).to.be.equal(50); // both balances for pool token be 50
                });

                it("investors can't claim yet", async function () {
                    await (await Pool.connect(investor1).buyPoolPartially(50)).wait()
                    var oldBalance = await StableCoin.balanceOf(investor1.address);
                    await expect(Pool.claimAsInsurer()).to.be.reverted;
                    var newBalance = await StableCoin.balanceOf(investor1.address);
                    expect(newBalance).to.be.equal(oldBalance);
                });
            });

            describe("house owners", function () {
                it("can claim damages.", async function () {
                    await expect(Pool.connect(hOwner1).makeClaimRequest(1)).not.to.be.reverted;
                    
                    var claimReq = await Pool.claimRequests(1);
                    expect(claimReq.tokenId).to.be.equal(1);
                });
                
                
                it("can't double claim damages.", async function (){
                    await (await Pool.connect(hOwner1).makeClaimRequest(1)).wait();
                    await expect( Pool.connect(hOwner1).makeClaimRequest(1)).to.be.revertedWith("Already has claim request!");
                });
            });

            describe("inspectors", function (){
                beforeEach(async function (){
                    await (await Pool.connect(hOwner1).makeClaimRequest(1)).wait();
                });

                it("can vote for house", async function () {
                    await expect(Pool.connect(inspector1).voteClaimRequest(1, true)).not.be.reverted;
                    await expect(Pool.connect(inspector2).voteClaimRequest(1, false)).not.be.reverted;
                    var claimReq = await Pool.claimRequests(1);
                    expect(claimReq.grantVotes).to.be.equal(1);
                    expect(claimReq.denyVotes).to.be.equal(1);
                });

                it("can grant house if majority of inspectors vote ok", async function(){
                    await (await Pool.connect(inspector1).voteClaimRequest(1, true)).wait();
                    await (await Pool.connect(inspector2).voteClaimRequest(1, true)).wait();
                    await (await Pool.connect(inspector3).voteClaimRequest(1, false)).wait();


                    expect((await Pool.claimRequests(1)).status).to.be.equal(1); // status == GRANTED

                });

                it("can deny house if majorty of inspectors vote not ok", async function (){
                    await (await Pool.connect(inspector1).voteClaimRequest(1, false)).wait();
                    await (await Pool.connect(inspector2).voteClaimRequest(1, false)).wait();
                    await (await Pool.connect(inspector3).voteClaimRequest(1, true)).wait();
                    expect((await Pool.claimRequests(1)).status).to.be.equal(2); // status == DENIED
                });
            });
        });


        describe("pool ends", function() {
            beforeEach(async function (){
                await (await Pool.connect(hOwner1).enterPool(1)).wait();
                await (await DeedNFT.safeMint(hOwner2.address, 2, ethers.utils.parseEther("200000"), 15, 31, 1234, 5678)).wait();
                await (await Pool.connect(hOwner2).enterPool(2)).wait();


                // await (await Pool.demoEndPoolEntrance()).wait();
                await Pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);
                await (await Pool.startTokenSale()).wait();

                await (await StableCoin.transfer(investor1.address, ethers.utils.parseEther("1000000000000"))).wait();
                await (await StableCoin.transfer(investor2.address, ethers.utils.parseEther("1000000000000"))).wait();

                PoolToken = await ethers.getContractAt("PoolToken", await Pool.getPoolTokenAddress());

                await (await Pool.connect(investor1).buyPoolPartially(50)).wait();
                await (await Pool.connect(investor2).buyPoolPartially(50)).wait();


                await (await Pool.connect(hOwner1).makeClaimRequest(1)).wait();
                await (await Pool.connect(hOwner2).makeClaimRequest(2)).wait();

                await (await Pool.connect(inspector1).voteClaimRequest(1, true)).wait();
                await (await Pool.connect(inspector2).voteClaimRequest(1, true)).wait();
                await (await Pool.connect(inspector3).voteClaimRequest(1, true)).wait();

                await (await Pool.connect(inspector1).voteClaimRequest(2, false)).wait();
                await (await Pool.connect(inspector2).voteClaimRequest(2, false)).wait();
                await (await Pool.connect(inspector3).voteClaimRequest(2, false)).wait();

                // await (await Pool.demoEndInsurancePeriod()).wait();
                await Pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 400]);
                await (await Pool.endInsurancePeriod()).wait();


            });
            describe("house owners claiming 'rewards'", function (){
                it("should let granted houses owners claim.", async function (){
                    var oldBalance = await StableCoin.balanceOf(hOwner1.address);
                    await expect(Pool.connect(hOwner1).claimAsHouseOwner(1)).not.to.be.reverted;
                    var newBalance = await StableCoin.balanceOf(hOwner1.address);
                    expect(newBalance).to.be.above(oldBalance);
                    
                });
                it("shouldn't let denied house owners claim.", async function (){
                    var beforeBalance = await StableCoin.balanceOf(hOwner1.address);
                    await expect(Pool.connect(hOwner2).claimAsHouseOwner(2)).to.be.reverted;
                    expect(await StableCoin.balanceOf(hOwner1.address)).to.be.equal(beforeBalance);
                });

                
                it("should let investor claim after house owners all claimed", async function () {
                    
                    await expect(Pool.connect(investor1).claimAsInsurer()).to.be.reverted;

                    await (await Pool.connect(hOwner1).claimAsHouseOwner(1)).wait();
                    // await (await Pool.demoEndPoolEntrance()).wait();
                    await Pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);
                    await (await Pool.endClaimPeriod()).wait();


                    await (await PoolToken.connect(investor1).approve(Pool.address, ethers.utils.parseEther("100"))).wait();
                    await (await PoolToken.connect(investor2).approve(Pool.address, ethers.utils.parseEther("100"))).wait();

                    await expect(Pool.connect(investor1).claimAsInsurer()).not.to.be.reverted;
                    var newBalance = await PoolToken.balanceOf(investor1.address);
                    expect(newBalance).to.be.equal(0);
                });
    
                
            });
    
            
        });

    });





});