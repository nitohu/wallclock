import express, {Response} from "express"
import auth from "../middleware/auth"
import Settings from "../models/settings"
import { Device } from "../models/device"
import logger from "../logger"

const router = express.Router()

router.get("/", auth, async (req: any, res: any): Promise<any> => {
    const devices = await Device.GetAll()

    return res.render("home", {
        settings: req.session.settings,
        title: "Welcome " + req.session.settings.username,
        devices
    })
})

// Handle login
router.get("/login", async (req: any, res: any): Promise<any> => {
    const settings = await Settings.GetLatestSettings()
    // Don't use login mask
    if (!settings.useLoginMask) {
        req.session.authenticated = true
        req.session.settings = settings
        return res.redirect("/")
    }
    // Already logged in
    if (req.session && req.session.authenticated && req.session.settings) {
        return res.redirect("/")
    }

    return res.render("login", {
        title: "Welcome",
        error: false
    })
})

router.post("/login", async (req: any, res: Response): Promise<any> => {
    let settings: Settings
    try {
        settings = await Settings.Authenticate(req.body.token)
    } catch (e: any) {
        // Login failed
        logger.warn(e.message)
        return res.render("login", {
            title: "Welcome",
            error: e.message
        })
    }
    logger.info(`Login successful from ${ req.ip }`)
    // Authentication successful
    req.session.authenticated = true
    req.session.settings = settings

    return res.redirect("/")
})

router.get("/logout", auth, async (req: any, res: any) => {
    req.session.destroy((err: string) => {
        if (err) logger.warn(`Error while destroying the session: ${err}`)
    })
    return res.redirect("/login")
})

export default router
