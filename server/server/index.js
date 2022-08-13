const express = require("express")
const ejs = require("ejs")
const { Client } = require("pg")
const path = require("path")
const config = require("./config")
const home = require("./routers/home")

// Set up server/app
const app = express()
app.set("views", path.join(__dirname, "templates"))
app.set("view engine", "ejs")

// Set up & connect to database, stop program if it fails
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

// Set up routers
app.use("/", home)

app.listen(8000, null)
