const express = require("express")
const auth = require("../middleware/auth")
const Settings = require("../models/settings")
const Device = require("../models/device")
const logger = require("../logger")

const router = express.Router()

router.get("/", auth, async (req, res) => {
    const devices = await Device.GetAll()

    return res.render("home", {
        settings: req.session.settings,
        title: "Welcome " + req.session.settings.username,
        devices
    })
})

// Handle login
router.get("/login", async (req, res) => {
    // Already logged in
    if (req.session && req.session.authenticated && req.session.settings) {
        return res.redirect("/")
    }

    return res.render("login", {
        title: "Welcome",
        error: false
    })
})

router.post("/login", async (req, res) => {
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

    return res.redirect("/")
})

router.get("/logout", auth, async (req, res) => {
    req.session.destroy((err) => {
        if (err) logger.warn(`Error while destroying the session: ${err}`)
    })
    return res.redirect("/login")
})

module.exports = router
