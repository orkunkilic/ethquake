import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import axios from "axios"
import nftCtcData from "../abis/DeedNFT.json"

const nftAddr = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner()
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);

const TransferPage = () => {

    const [houses, setHouses] = useState([])
    const [isOwner, setIsOwner] = useState(false)
    const [receiverAddr, setReceiverAddr] = useState()
    const [ownerAddr, setOwnerAddr] = useState()

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
                houses.push(house)
            }
            console.log("houses = ", houses);
            setHouses(houses)
        }
        getOwnedHouses()
    }, [])

    const approveTranfer = async (id, zipCode, receiver) => {
        const res = await axios.post(
            "http://localhost:3001/nft/transfer",
            {
                houseId: id,
                zipCode: zipCode
            }
        )
        console.log(res)
    }

    const approveReceivment = async (owner) => {

    }

    const renderHouseComp = (price, risk, zipCode, id) => {
        return (<div>
            <h3>House Price: {price}$</h3>
            <h3>House Risk: {risk}%</h3>
            <button onClick={() => { approveTranfer(id, zipCode, receiverAddr) }}>
                Transfer House</button>
        </div>)
    }

    const ownerComp = (<div>
        <input type="text" placeholder="Receiver Address"
            onChange={(e) => { setReceiverAddr(e.target.value) }} />
        {
            houses.length > 0 ?
                houses.map(h => renderHouseComp(h.marketValue, h.riskScore, h.zipCode, h.tokenId))
                : <h1>Loading</h1>
        }
    </div>)

    const receiverComp = (<div>
        <input type="text" placeholder="Receiver Address"
            onChange={(e) => { setOwnerAddr(e.target.value) }} />
        <button onClick={() => { approveReceivment(ownerAddr) }}>Approve Receivment</button>
    </div>)

    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column"
        }}>
            <h1>Transfer Page</h1>
            <label>Owner</label>
            <input onChange={(e) => { setIsOwner(true) }}
                type="radio" name="Owner" checked={isOwner} />
            <label>Receiver</label>
            <input onChange={(e) => { setIsOwner(false) }}
                type="radio" name="Receiver" checked={!isOwner} />
            <br /><br />
            {isOwner ? ownerComp : receiverComp}
        </div>
    )
}

export default TransferPage