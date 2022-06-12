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

const BuyTokensOfPool = () => {
    


    const [amount, setAmount] = useState("");

    useEffect(() => {
        
    }, [])

    const buyShare = async () => {
        showPopup("You are trying to buy");
    }

    const showPopup = async (text) => {
        alert(text);
    }



    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column"
        }}>
            <Text h1>Buy pool share</Text>
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column"
            }}>
                <Input placeholder="Amount to but" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                <Button type="success" mt={1} onClick={buyShare}>Buy share</Button>
            </div>
            
        </div>
    )
}

export default BuyTokensOfPool