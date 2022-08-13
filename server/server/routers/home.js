const express = require("express")
// const auth = require("../middleware/auth")
const Settings = require("../models/settings")
const Authentication = require("../models/authentication")

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
        console.warn(e)
        return res.render("login", {
            settings,
            title: "Welcome",
            error: e.message
        })
    }
    // Authentication successful
    req.session.authenticated = true
    req.session.settings = settings
    return res.render("home", {
        settings,
        title: "Welcome " + settings.username
    })
})

module.exports = router
