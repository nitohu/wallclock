const express = require("express")
const { Client } = require("pg")
const config = require("./config")

const app = express()
const client = new Client({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPass,
    database: config.dbDatabase
})

client.connect().then(() => {
    console.log(`Successfully connected to database ${config.dbDatabase} on ${config.dbHost}`)
}).catch(err => {
    console.error(`There was an error while connecting to the database: ${err}`)
    process.exit(1)
})

app.get("/", async (req, res) => {
    res.send("<h1>Hello World!</h1>")
})

app.listen(8000, null)
