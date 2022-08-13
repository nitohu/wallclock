const express = require("express")
const ejs = require("ejs")
const path = require("path")
const config = require("./config")
const db = require("./db")
const home = require("./routers/home")

// Set up server/app
const app = express()
app.set("views", path.join(__dirname, "templates"))
app.set("view engine", "ejs")

// Set up routers
app.use("/", home)

app.listen(8000, null)
