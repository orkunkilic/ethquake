const express = require('express')
const axios = require('axios')
const app = express()
const port = 3000

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

app.listen(port, () => {
  console.log(`Earthquake app listening on port ${port}`)
})