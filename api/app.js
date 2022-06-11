const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const { ethers } = require('dotenv')
require('dotenv').config()

const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

const db = new JsonDB(new Config("db.json", true, true, '/'));

const app = express()
const port = 3001

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const NFT_ADDRESS = '0x0'
const Deed_NFT_ABI = require('./DeedNFT.json')

const RPC_URL = process.env.RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY

app.get('/', async (req, res) => {
    date = new Date()
    var dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
    date.setTime(date.getTime() - (24*60*60*1000) * 15)
    var dateString2 = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
    const url =`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&${dateString2}&endtime=${dateString}&latitude=${req.query.latitude}&longitude=${req.query.longitude}&maxradiuskm=10000&minmagnitude=2`
    console.log(url)
    const r = await axios(url)
    if(r.data.features.length > 0) {
        res.json({
            result
        })
    } else {
        res.send(false)
    }
}) 

app.post('/nft/issue', async (req, res) => {
    // should have a middleware to check origin

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    const contract = new ethers.Contract(NFT_ADDRESS, Deed_NFT_ABI, wallet)

    const unsignedTx = await contract.populateTransaction.mint(
        req.body.address,
        req.body.houseId,
        req.body.zipCode,
        100000, // mock values for demo purposes
        25, // mock values for demo purposes
        50, // mock values for demo purposes
        70 // mock values for demo purposes
    )

    const signedTx = await wallet.signTransaction(unsignedTx)

    const tx = await provider.sendTransaction(signedTx)

    res.send(tx.hash)
})

app.post('/nft/transfer', async (req, res) => {
    // should have a middleware to check origin
    const { tokenId, address, signature, receiverAddress } = req.body
    let data

    if(receiverAddress) { // then it is a owner request
        try {
            data = db.getData("/" + tokenId)
            res.json({
                success: false,
                message: "You already have a pending transfer request!"
            })
        } catch (error) {
            db.push(`/`, {
                [tokenId]: {
                    owner: {
                        address,
                        signature
                    },
                    receiver: {
                        address: req.body.receiverAddress,
                    }
                }
            })
            res.json({
                success: true,
                message: "Transfer request sent!"
            })
        }
    }
    else { // then it is a receiver request
        try {
            data = db.getData("/" + tokenId)

            if(data.receiver.address != address) {
                res.json({
                    success: false,
                    message: "You are not the receiver of this transfer request!"
                })
            }
        
            const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
        
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
        
            const contract = new ethers.Contract(NFT_ADDRESS, Deed_NFT_ABI, wallet)
        
            const unsignedTx = await contract.populateTransaction.transfer(
                data.owner.address,
                address,
                tokenId, 
                data.owner.signature, 
                signature
            )
        
            const signedTx = await wallet.signTransaction(unsignedTx)
        
            const tx = await provider.sendTransaction(signedTx)
        
            res.json({
                success: true,
                message: tx.hash
            })
        } catch (error) {
            res.json({
                success: false,
                message: "Invalid transfer request!"
            })
        }
    }
}) 

app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})