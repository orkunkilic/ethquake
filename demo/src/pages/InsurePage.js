import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
import poolCtcData from "../abis/Pool.json"
import nftCtcData from "../abis/DeedNFT.json"
import tokenData from "../abis/token.json"

const poolAddr = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
const nftAddr = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
const tokenAddr = ""
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const poolCtc = new ethers.Contract(poolAddr, poolCtcData.abi, signer);
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);
const tokenCtc = new ethers.Contract(tokenAddr, tokenData.abi, signer)

const InsurePage = () => {

    useEffect(() => {
        const getOwnedHouses = async () => {
            let houses = []
            const addr = await signer.getAddress()
            console.log("address = ", addr);
            // houses = await nftCtc.tokenIdsByAddress(addr)
            // console.log("houses = ", houses);
            const noOfHouses = await nftCtc.balanceOf(addr);
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
                house.policyFee = policyFee.toNumber();
                houses.push(house)
            }
            console.log("houses = ", houses);
            setHouses(houses)
        }
        getOwnedHouses()
    }, [])

    const [houses, setHouses] = useState([]);

    const insure = async (price, id) => {
        const txn = await poolCtc.enterPool(id)
        const receipt = await txn.wait()
        console.log(receipt)
    }

    const renderInsureComp = (policyFee, price, risk, id, index) => {
        console.log("asdasda")
        console.log(id);
        return (<div key={index}>
            <h3>House Price: {price / 10 ** 6}$</h3>
            <h3>House Risk: {risk}%</h3>
            <h3>Calculated Policy Fee: {policyFee / 10 ** 6 ?? 0}$</h3>
            <button onClick={() => { insure(price, id) }}>Insure My House</button>
        </div>)
    }

    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column"
        }}>
            <h1>Insurance Page</h1>
            {houses.length > 0 ?
                houses.map((h, index) => renderInsureComp(h.policyFee, h.marketValue, h.riskScore, h.tokenId, index))
                : <h1>No Houses</h1>}
        </div>
    )
}

export default InsurePage