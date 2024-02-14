const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);

app.get(/.*/, async (req, res) => {
    res.send(req.originalUrl)
})
  
  server.listen(process.env.PORT || 4000, () => {
    console.log(`listening on port ${process.env.PORT || 4000} _<`)
})
  
console.log("Started _<")