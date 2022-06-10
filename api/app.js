const express = require('express')
const axios = require('axios')
const { ethers } = require('dotenv')
require('dotenv').config()

const app = express()
const port = 3000

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
        res.send(true)
    } else {
        res.send(false)
    }
}) 

app.post('/nft/issue', async (req, res) => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    const contract = new ethers.Contract(NFT_ADDRESS, Deed_NFT_ABI, wallet)

    const unsignedTx = await contract.populateTransaction.mint(req.body)

    const signedTx = await wallet.signTransaction(unsignedTx)

    const tx = await provider.sendTransaction(signedTx)

    res.send(tx.hash)
})

app.post('/nft/transfer', async (req, res) => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    const contract = new ethers.Contract(NFT_ADDRESS, Deed_NFT_ABI, wallet)

    const unsignedTx = await contract.populateTransaction.transfer(req.body.owner, req.body.receiver, req.body.tokenId, req.body.ownerSignature, req.body.receiverSignature)

    const signedTx = await wallet.signTransaction(unsignedTx)

    const tx = await provider.sendTransaction(signedTx)

    res.send(tx.hash)
})

app.listen(port, () => {
  console.log(`Earthquake app listening on port ${port}`)
})