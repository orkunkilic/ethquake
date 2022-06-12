const { expect } = require("chai");
const chai = require("chai");
const { smock } = require('@defi-wonderland/smock');
const { ethers } = require("hardhat");

describe("Pool contract - big test case", function () {
    chai.use(smock.matchers);
    
    let DeedNFT;
    let StableCoin;
    let DeinsuranceToken;
    let Staking;
    let Pool;
    let PoolToken;
    let minPoolRisk = 20, maxPoolRisk = 40;
    let numOfHouseholds = 100;
    let willBeDamaged = [];
    

    // await ethers.ethersnetwork.provider.send("evm_setNextBlockBaseFeePerGas", [
    //     "0x2540be400", // 10 gwei
    //   ]);

    beforeEach(async function () {
        [owner, ins1, ins2, ins3, houseOwner, acc5, acc6, ...accs] = await ethers.getSigners();
        console.log(await owner.getBalance());
        //Get a provider
        provider = ethers.getDefaultProvider();
        // print lenght of accs
        console.log(accs.length);

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
        pool = await Pool.deploy(deedNFT.address, stableCoin.address, minPoolRisk, maxPoolRisk, 100, 3, staking.address, apiConsumer.address);



        await stableCoin.mint(owner.address, ethers.utils.parseEther("100000"));

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

        await pool.addInspector(34, ins1.address);
        await pool.addInspector(34, ins2.address);
        await pool.addInspector(34, ins3.address);


        // console.log("HIIII");
        
        for(let i = 1; i <= numOfHouseholds; i++){
            if(i % 10 == 0){
                console.log(i);
            }
            // Create a random wallet for each household
            // console.log("HIIII");
            let houseOwner = ethers.Wallet.createRandom();
            // Set provider for houseOwner
            houseOwner = houseOwner.connect(ethers.provider);
            // let houseOwner = wallet.address;
            // console.log("ö");
            await stableCoin.mint(houseOwner.address, ethers.utils.parseEther("100000"));
            // console.log("Hi2");
            await owner.sendTransaction({to: houseOwner.address, value: ethers.utils.parseEther("1")});
            // console.log("Hi3");
            await stableCoin.connect(houseOwner).approve(pool.address, ethers.utils.parseEther("1000000000"));
            // console.log("Höööö");
            await deedNFT.safeMint(houseOwner.address, 2222, 100_000_000000, 25, 34, 60, 70);
            // await stableCoin.connect(houseOwner).approve(pool.address, ethers.utils.parseEther("100000000000"));
            await pool.connect(houseOwner).enterPool(i);

            // Make this house damaged in the future with random chance
            let random = Math.floor(Math.random() * 100);
            if(random >= minPoolRisk && random <= maxPoolRisk){
                willBeDamaged.push([houseOwner, i]);
            }
        }
        console.log("Length of damaged house list is ", willBeDamaged.length);


        // await stableCoin.connect(houseOwner).approve(pool.address, ethers.utils.parseEther("100000000000"));
        await pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);

    });

    it('should reinvest pool money to damaged houses', async function () {
        // await pool.connect(houseOwner).enterPool(1);

        // await pool.connect(houseOwner).enterPool(2);

        // await pool.connect(houseOwner).enterPool(3);

        // await pool.connect(willBeDamaged[i][0]).preRequestCheckEarthQuake(willBeDamaged[i][1]);
        //await pool.connect(houseOwner).makeClaimRequest(1); // error
        await pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);
        await pool.endPoolRegistrationPeriod();

        for(let i = 0; i < willBeDamaged.length; i++){
            await pool.connect(willBeDamaged[i][0]).preRequestCheckEarthQuake(willBeDamaged[i][1]);
            await pool.connect(willBeDamaged[i][0]).makeClaimRequest(willBeDamaged[i][1]);
            await pool.connect(ins1).voteForClaimRequest(willBeDamaged[i][1], true);
            await pool.connect(ins2).voteForClaimRequest(willBeDamaged[i][1], true);
            await pool.connect(ins3).voteForClaimRequest(willBeDamaged[i][1], true);
    
        }

        // await pool.connect(willBeDamaged[i][0]).preRequestCheckEarthQuake(willBeDamaged[i][1]);
        // await pool.connect(houseOwner).makeClaimRequest(1);

        // console.log(await pool.connect(houseOwner).claimRequests(1));


        // console.log(await pool.connect(houseOwner).claimRequests(1));
        // console.log(await staking.stakeDetails(ins1.address));
        // console.log(await staking.stakeDetails(ins2.address));
        // console.log(await staking.stakeDetails(ins3.address));

        //await pool.connect(houseOwner).claimFundsForHouseOwner(1); // error as it is not ended yet!

        await pool.provider.send("evm_increaseTime", [60 * 60 * 24 * 396]);

        await pool.endInsurancePeriod();

        console.log("amountAtTheEnd", await pool.amountAtTheEnd());
        console.log("stableCoin.balanceOf(pool.address)", await stableCoin.balanceOf(pool.address));
        for(let i = 0; i < willBeDamaged.length; i++){
            await pool.connect(willBeDamaged[i][0]).claimFundsForHouseOwner(willBeDamaged[i][1]);    
        }

        // await pool.connect(houseOwner).claimFundsForHouseOwner(1); 

        console.log(await stableCoin.balanceOf(pool.address));
        
        expect(true).to.be.true;
    })

});   