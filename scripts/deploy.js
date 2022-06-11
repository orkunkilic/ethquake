async function main() {
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    // log addresses
    console.log("owner:", owner.address);
    console.log("addr1:", addr1.address);
    console.log("addr2:", addr2.address);
    console.log("addr3:", addr3.address);
    console.log("addr4:", addr4.address);



    const DeedNFTContract = await ethers.getContractFactory("DeedNFT");
    const DeedNft = await DeedNFTContract.deploy();
    await DeedNft.deployed();

    console.log(DeedNft.address, "Deed NFT");

    const StableCoinContract = await ethers.getContractFactory("StableCoin");
    const StableCoin = await StableCoinContract.deploy();
    await StableCoin.deployed();

    
    console.log(StableCoin.address, "StableCoin");



    const DeinsuranceTokenContract = await ethers.getContractFactory("DeinsuranceToken");
    const DeinsuranceToken = await DeinsuranceTokenContract.deploy();
    await DeinsuranceToken.deployed();

    
    console.log(DeinsuranceToken.address, "DeinsuranceToken");


    const StakingContract = await ethers.getContractFactory("Staking");
    const Staking = await StakingContract.deploy(DeinsuranceToken.address);
    await Staking.deployed();

    
    console.log(Staking.address, "Staking");



    const PoolContract = await ethers.getContractFactory("Pool");
    const Pool = await PoolContract.deploy(DeedNft.address, StableCoin.address, 10, 20, 10, 3, Staking.address);
    await Pool.deployed();

    
    console.log(Pool.address, "Pool");

    // expect(await greeter.greet()).to.equal("Hello, world!");

    const giveApprovalTx = await StableCoin.approve(Pool.address, ethers.utils.parseEther("1000000"));
    await giveApprovalTx.wait();
    console.log("Approved");

    // create dummy account
    // const dummyAccount = await ethers.getSigner();
    // const dummyAddress = dummyAccount.address;
    // console.log(dummyAddress, "dummyAddress");

    //Mint a house from deednft
    const mintHouseTx = await DeedNft.safeMint(owner.address, 1, ethers.utils.parseEther("100000"), 13, 31, 1234, 5678);
    await mintHouseTx.wait();
    console.log("Minted house");

    // console.log("Zip code of the house 1 is ", await DeedNft.getZipcode(1));
    // expect(await DeedNft.getZipcode(1)).to.equal(31);

    // Log the owner of contract
    console.log("Owner of the contract is ", await Pool.owner());

    
    // add this function Pool.addInspector(31, addr1.address);
    const addInspectorTx = await Pool.addInspector(31, addr1.address);
    await addInspectorTx.wait();

    console.log("Added inspector");
    // Add another inspector
    const addInspectorTx2 = await Pool.addInspector(31, addr2.address);
    await addInspectorTx2.wait();
    console.log("Added inspector");
    // Add another inspector
    const addInspectorTx3 = await Pool.addInspector(31, addr3.address);
    await addInspectorTx3.wait();
    console.log("Added inspector");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });