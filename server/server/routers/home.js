const express = require("express")
// const auth = require("../middleware/auth")
const Settings = require("../models/settings")
const Authentication = require("../models/authentication")
const logger = require("../logger")

const router = express.Router()

router.get("/", async (req, res) => {
    // TODO: If user is authenticated, redirect to dashboard (or build that logic in the template)
    if (req.session.authenticated && req.session.settings) {
        return res.render("home", {
            settings: req.session.settings,
            title: "Welcome " + req.session.settings.username
        })
    }
    // User is not authenticated
    return res.render("login", {
        title: "Welcome",
        error: false
    })
})

// Handle login
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
    return res.render("home", {
        settings,
        title: "Welcome " + settings.username
    })
})

router.get("/logout", async (req, res) => {
    if (!req.session) return res.redirect("/")

    req.session.destroy((err) => {
        if (err) logger.warn(`Error while destroying the session: ${err}`)
    })
    return res.redirect("/")
})

module.exports = router
