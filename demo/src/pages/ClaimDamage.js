import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
import poolCtcData from "../abis/Pool.json"
import nftCtcData from "../abis/DeedNFT.json"
import tokenData from "../abis/PoolToken.json"
import stableData from "../abis/StableCoin.json"



const poolAddr = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
const nftAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const stableAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const tokenAddr = ""
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const poolCtc = new ethers.Contract(poolAddr, poolCtcData.abi, signer);
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);
const tokenCtc = new ethers.Contract(tokenAddr, tokenData.abi, signer)
const stableCtc = new ethers.Contract(stableAddr, stableData.abi, signer)

const ClaimDamage = () => {

    useEffect(() => {

        const getOwnedHouses = async () => {
            let houses = []
            const addr = await signer.getAddress()
            console.log("address = ", addr);
            // houses = await nftCtc.tokenIdsByAddress(addr)
            // console.log("houses = ", houses);
            const noOfHouses = await nftCtc.balanceOf(addr);
            console.log("noOfHouses = ", noOfHouses.toNumber());
            for (let i = 0; i < noOfHouses.toNumber(); i++) {
                let house = {};
                const tokenId = await nftCtc.tokenOfOwnerByIndex(addr, i)
                const metadata = await nftCtc.getMetadata(tokenId)
                // house = {...metadata}
                // console.log("metadata = ", metadata);
                house.tokenId = tokenId;
                house.houseId = metadata[0].toNumber()
                house.marketValue = metadata[1].toNumber()
                house.riskScore = metadata[2]
                house.zipCode = metadata[3].toNumber()
                house.latitude = metadata[4].toNumber()
                house.longitude = metadata[5].toNumber()
                const policyFee = await poolCtc.calcEntranceFee(tokenId)
                const isHouseInPool = await poolCtc.housesInPool(tokenId)
                const isHouseIsAlreadyDamaged = await poolCtc.claimRequests(tokenId)
                console.log("isHouseIsAlreadyDamaged", isHouseIsAlreadyDamaged[0].toNumber())
                house.policyFee = policyFee.toNumber();
                console.log("isHouseInPool", isHouseInPool);
                if(isHouseInPool && isHouseIsAlreadyDamaged[0].toNumber() == 0) {
                    houses.push(house)
                }
            }
            console.log("houses = ", houses);
            setHouses(houses)
        }
        getOwnedHouses()
    }, [])

    const [houses, setHouses] = useState([]);

    const claimHouseDamage = async (id) => {
        // await stableCtc.approve(poolAddr, price);
        const txn = await poolCtc.makeClaimRequest(id)
        const receipt = await txn.wait()
        console.log(receipt)
    }

    const renderInsureComp = (houseId, policyFee, price, risk, id, index) => {
        console.log("asdasda")
        console.log(id);
        return (<div key={index}>
            <h3>You house in address: {houseId}</h3>
            <h3>House Price: {price / 10 ** 6}$</h3>
            <h3>House Risk: {risk}%</h3>
            <button onClick={() => { claimHouseDamage(id) }}>Claim there is a damage in your house</button>
        </div>)
    }

    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column"
        }}>
            <h1>Claim damage to your house</h1>
            {houses.length > 0 ?
                houses.map((h, index) => renderInsureComp(h.houseId, h.policyFee, h.marketValue, h.riskScore, h.tokenId, index))
                : <h1>No Houses</h1>}
        </div>
    )
}

export default ClaimDamage