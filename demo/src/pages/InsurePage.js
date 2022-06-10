import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
let poolCtcData
let nftCtcData

const poolAddr = "0xd7503bC5957132D9f80a27BB0A6bAF6148ef906E"
const nftAddr = ""
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const poolCtc = new ethers.Contract(poolAddr, poolCtcData.abi, signer);
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);

const InsurePage = () => {

    useEffect(() => {
        const getOwnedHouses = async () => {
            const houses = []
            const addr = await signer.getAddress()
            const noOfHouses = await nftCtc.balanceOf(noOfHouses);
            for (let i = 0; i < noOfHouses.toNumber(); i++) {
                const tokenId = await nftCtc.tokenOfOwnerByIndex(addr, i)
                const house = await nftCtc.getHouseById(tokenId)
                house.tokenId = tokenId
                houses.push(house)
            }
            setHouses(houses)
        }
        getOwnedHouses()
    }, [])

    const [policyFee, setPolicyFee] = useState();
    const [houses, setHouses] = useState();

    const insure = async (price, id) => {
        const entranceFee = await poolCtc.calcEntranceFee(price)
        const txn = await poolCtc.enterPool(id,
            { value: ethers.utils.parseUnits(entranceFee.toString(), "wei")})
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
            {houses.map(h => renderInsureComp(h.policyFee, h.price, h.risk, h.tokenId))}
        </div>
    )
}

export default InsurePage