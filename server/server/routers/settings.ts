import express, {Response, Request} from "express";
import auth from "../middleware/auth";
import Settings from "../models/settings";
import logger from "../logger";
import timezones from "timezones-list";


const router = express.Router()

router.get("/", auth, async (req: any, res: Response) => {
    const settings = await Settings.GetLatestSettings()
    const tz = timezones.sort((x, y) => x.tzCode < y.tzCode ? 1 : -1)
    return res.render("settings", {
        settings,
        title: "Settings",
        error: null,
        timezones: tz
    })
})

router.post("/", auth, async (req: any, res: Response) => {
    const settings = await Settings.GetLatestSettings()

    if (!req.body.name) {
        return res.render("settings", {
            settings,
            title: "Settings",
            error: "Please provide a username."
        })
    }

    try {
        settings.username = req.body.name
        settings.timezone = req.body.timezone
        settings.darkMode = req.body.darkMode
        settings.useLoginMask = req.body.useLoginMask
        settings.winterTime = req.body.winterTime
        if (req.body.password) await settings.setPassword(req.body.password)

        await settings.save()
    } catch (e) {
        logger.info(`Error while saving the settings: ${e}`)
        return res.render("settings", {
            settings,
            title: "Settings",
            error: `There was an error while saving the settings: ${e}`
        })
    }

    req.session.settings = settings
    return res.redirect("/")
})

export default router