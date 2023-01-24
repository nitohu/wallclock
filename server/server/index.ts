import express, {Express, Request, Response, NextFunction} from "express"
import session from "express-session"
import path from "path"
import config from "./config"
import logger from "./logger"
import home from "./routers/home"
import devices from "./routers/device"
import api from "./routers/api"
import settings from "./routers/settings"

// Set up server/app
process.env.TZ = config.timezone
const app: Express = express()
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
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${ req.method } ${ req.path } - ${req.ip}`)
    next()
})

// Set up routers
app.use("/", home)
app.use("/devices", devices)
app.use("/api", api)
app.use("/settings", settings)

app.listen(8000)
