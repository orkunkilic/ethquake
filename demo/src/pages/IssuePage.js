import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
import nftCtcData from "../abis/DeedNFT.json"
import { Button, Input, Text } from "@geist-ui/core"
import axios from "axios"

const nftAddr = ""
// const provider = new ethers.providers.Web3Provider(window.ethereum)
// console.log(provider);
// const signer = provider.getSigner()
// console.log(signer);
// console.log(signer._address);
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
// Prompt user for account connections
const signer = provider.getSigner();

const nftCtc = new ethers.Contract(nftAddr, nftCtcData.abi, signer);

const IssuePage = () => {
    


    const [addressId, setAddressId] = useState("");
    const [zipCode, setZipCode] = useState("");

    useEffect(() => {
        
    }, [])

    const issue = async () => {
        showPopup("We are checking your data and ownership...")
        await provider.send("eth_requestAccounts", []);
        const address = await signer.getAddress();
        console.log("Address = ",address);
        // console.log("Account:", await );
        const res = await axios.post(
            "https://deinsurance.herokuapp.com/nft/issue",
            {
                houseId: addressId,
                zipCode: zipCode,
                address: address
                // TODO: add address to the request
            }
        )
        console.log(res)
        showPopup("Success!!")
    }

    const showPopup = async (text) => {
        alert(text);
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
                <Button type="success" mt={1} onClick={issue}>Issue Deed NFT</Button>
            </div>
            
        </div>
    )
}

export default IssuePage