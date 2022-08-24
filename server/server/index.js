const express = require("express")
const session = require("express-session")
const path = require("path")
const config = require("./config")
const logger = require("./logger")
const home = require("./routers/home")
const devices = require("./routers/device")
const api = require("./routers/api")

// Set up server/app
process.env.TZ = config.timezone
const app = express()
app.set("views", path.join(__dirname, "templates"))
app.set("view engine", "ejs")
app.use(express.static("public"))
// Parse json & forms
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// Session
app.use(session({
    secret: config.sessionSecret,
    saveUninitialized: false,
    cookie: { secure: config.ssl }
}))
// Log requests
app.use((req, res, next) => {
    logger.info(`${ req.method } ${ req.path } - ${req.ip}`)
    next()
})

// Set up routers
app.use("/", home)
app.use("/devices", devices)
app.use("/api", api)

app.listen(8000, null)
