import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
import poolCtcData from "../abis/pool.json"
import nftCtcData from "../abis/nft.json"
import tokenData from "../abis/token.json"

const poolAddr = "0xd7503bC5957132D9f80a27BB0A6bAF6148ef906E"
const nftAddr = ""
const tokenAddr = ""
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const poolCtc = new ethers.Contract(poolAddr, poolCtcData.abi, signer);
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);
const tokenCtc = new ethers.Contract(tokenAddr, tokenData.abi, signer)

const InsurePage = () => {

    useEffect(() => {
        const getOwnedHouses = async () => {
            const houses = []
            const addr = await signer.getAddress()
            const noOfHouses = await nftCtc.balanceOf(addr);
            for (let i = 0; i < noOfHouses.toNumber(); i++) {
                const tokenId = await nftCtc.tokenOfOwnerByIndex(addr, i)
                const house = await nftCtc.getterForMetadata(tokenId)
                const policyFee = await poolCtc.calcEntranceFee(house.amrketValue)
                house.policyFee = policyFee
                houses.push(house)
            }
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

    const renderInsureComp = (policyFee, price, risk, id) => {
        return (<div>
            <h3>House Price: {price}$</h3>
            <h3>House Risk: {risk}%</h3>
            <h3>Calculated Policy Fee: {policyFee ?? 0}$</h3>
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
                houses.map(h => renderInsureComp(h.policyFee, h.marketValue, h.risk, h.tokenId))
                : <h1>No Houses</h1>}
        </div>
    )
}

export default InsurePage