import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import axios from "axios"
import nftCtcData from "../abis/nft.json"

const nftAddr = "0x8FCe455CD57b54E691B2bE2698DDB3c2c232d39c"
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);

const TransferPage = () => {

    const [houses, setHouses] = useState([])
    const [isOwner, setIsOwner] = useState(false)
    const [receiverAddr, setReceiverAddr] = useState()
    const [tokIdToReeceive, setTokIdToReceive] = useState()

    useEffect(() => {
        const getOwnedHouses = async () => {
            const housesArr = []
            const addr = await signer.getAddress()
            const noOfHouses = await nftCtc.balanceOf(addr);
            for (let i = 0; i < noOfHouses.toNumber(); i++) {
                const tokenId = await nftCtc.tokenOfOwnerByIndex(addr, i)
                const house = await nftCtc.getMetadata(tokenId)
                housesArr.push(house);
            }
            setHouses(housesArr)
            console.log("use effect")
        }
        getOwnedHouses()
    }, [])

    const approveTranfer = async (tokenId, receiver) => {
        const address = await signer.getAddress()
        const signedMessage = await signer.signMessage(tokenId.toString());
        const res = await axios.post(
            "http://localhost:3001/nft/transfer",
            {
                address,
                receiver,
                tokenId,
                signature: signedMessage,
            }
        )
        console.log(res)
    }

    const approveReceivment = async (tokenId) => {
        const address = await signer.getAddress()
        const signedMessage = await signer.signMessage(tokenId.toString());
        const res = await axios.post(
            "http://localhost:3001/nft/transfer",
            {
                address,
                tokenId,
                signature: signedMessage,
            }
        )
        console.log(res)
        console.log(signedMessage)
    }

    const renderHouseComp = (price, risk, zipCode, id, idx) => {
        return (<div key={idx}>
            <h3>House Price: {price}$</h3>
            <h3>House Risk: {risk}%</h3>
            <button onClick={() => { approveTranfer(id, receiverAddr) }}>
                Transfer House</button>
        </div>)
    }

    const ownerComp = (<div>
        <input type="text" placeholder="Receiver Address"
            onChange={(e) => { setReceiverAddr(e.target.value) }} />
        {
            houses.length > 0 ?
                houses.map((h, idx) => renderHouseComp(h.marketValue.toString(),
                    h.riskScore.toString(), h.zipCode.toString(), h.houseId.toNumber(), idx))
                : <h1>Loading</h1>
        }
    </div>)

    const receiverComp = (<div>
        <input placeholder="House Id to Receive" type="number"
            onChange={(e) => { setTokIdToReceive(e.target.value) }} />
        <button onClick={() => { approveReceivment(tokIdToReeceive) }}>Approve Receivment</button>
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