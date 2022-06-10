import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
import nftCtcData from "../abis/nft.json"
import { Button, Input, Text } from "@geist-ui/core"

const nftAddr = ""
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);

const IssuePage = () => {

    const [addressId, setAddressId] = useState("");
    const [zipCode, setZipCode] = useState("");

    useEffect(() => {
        
    }, [])

    const issue = async () => {
        showPopup("We are checking your data and ownership...")
        const res = await axios.post(
            "http://localhost:3001/nft/issue",
            {
                houseId: addressId,
                zipCode: zipCode
            }
        )
        console.log(res)
    }

    const showPopup = async (text) => {
        alert('')
    }



    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column"
        }}>
            <Text h1>Issue Deed NFT</Text>
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column"
            }}>
                <Input placeholder="Global Address Id" value={addressId} onChange={(e) => setAddressId(e.target.value)}/>
                <Input mt={1} placeholder="ZIP Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)}/>
                <Button onClick={issue}>Issue Deed NFT</Button>
            </div>
            
        </div>
    )
}

export default IssuePage