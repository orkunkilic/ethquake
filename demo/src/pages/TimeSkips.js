import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
//import data from "../abis/"
// import nftCtcData from "../abis/nft.json"
import poolCtcData from "../abis/Pool.json"
import { Button, Input, Text } from "@geist-ui/core"
import axios from "axios"

// const nftAddr = ""
// const poolAddr = ""
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
const signer = provider.getSigner();

// const poolCtc = new ethers.Contract(poolAddr, poolCtcData.abi, signer);

const TimeSkips = () => {
    


    const [addressId, setAddressId] = useState("");
    const [zipCode, setZipCode] = useState("");

    useEffect(() => {
        
    }, [])

    const demoEndPoolEntrance = async () => {
        showPopup("We are skipping 40 days")
        await provider.send("eth_requestAccounts", []);
        const address = await signer.getAddress();
        console.log("Address = ",address);
        // console.log("Account:", await );
        const res = await axios.get(
            "https://deinsurance.herokuapp.com/demo/demoEndPoolEntrance",
            {
            }
        )
        console.log(res)
        showPopup("Success!!")
    }

    const demoEndInsurancePeriod = async () => {
        showPopup("We are skipping 400 days")
        await provider.send("eth_requestAccounts", []);
        const address = await signer.getAddress();
        console.log("Address = ",address);
        // console.log("Account:", await );
        const res = await axios.get(
            "https://deinsurance.herokuapp.com/demo/demoEndInsurancePeriod",
            {
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
                <Button type="success" mt={1} onClick={demoEndPoolEntrance}>demoEndPoolEntrance</Button>
                <Button type="success" mt={1} onClick={demoEndInsurancePeriod}>demoEndInsurancePeriod</Button>
            </div>
            
        </div>
    )
}

export default TimeSkips