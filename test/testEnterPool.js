const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnterPoolTester", function () {
  it("Should enter the pool", async function () {
    const DeedNFTContract = await ethers.getContractFactory("DeedNFT");
    const DeedNft = await DeedNFTContract.deploy("0xdD870fA1b7C4700F2BD7f44238821C26f7392148");
    await DeedNft.deployed();

    console.log(DeedNft.address);

    // expect(await greeter.greet()).to.equal("Hello, world!");

    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});