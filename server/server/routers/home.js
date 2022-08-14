const express = require("express")
const auth = require("../middleware/auth")
const Settings = require("../models/settings")
const Device = require("../models/device")
const logger = require("../logger")

const router = express.Router()

router.get("/", auth, async (req, res) => {
    const devices = await Device.GetAll()
    logger.info(`Found ${devices.length} devices`)
    for (let i = 0; i < devices.length; i++) {
        logger.info(`Device #${i+1}: ${devices[i].name}, ${devices[i].ip} (${devices[i].getID()})`)
    }

    return res.render("home", {
        settings: req.session.settings,
        title: "Welcome " + req.session.settings.username,
        devices
    })
})

// Handle login
// NOTE: Probably need to move it to custom /login route
router.post("/", async (req, res) => {
    let settings;
    try {
        settings = await Settings.Authenticate(req.body.token)
    } catch (e) {
        // Login failed
        logger.warn(e.message)
        return res.render("login", {
            settings,
            title: "Welcome",
            error: e.message
        })
    }
    logger.info(`Login successful from ${ req.ip }`)
    // Authentication successful
    req.session.authenticated = true
    req.session.settings = settings
    const devices = await Device.GetAll()
    return res.render("home", {
        settings,
        title: "Welcome " + settings.username,
        devices
    })
})

router.get("/logout", auth, async (req, res) => {
    req.session.destroy((err) => {
        if (err) logger.warn(`Error while destroying the session: ${err}`)
    })
    return res.redirect("/")
})

module.exports = router
