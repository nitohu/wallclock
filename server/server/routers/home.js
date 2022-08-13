const express = require("express")
// const auth = require("../middleware/auth")
const Authentication = require("../models/authentication")

const router = express.Router()

router.get("/", async (req, res) => {
    // Only for testing purposes
    const a = new Authentication("admin", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8")
    await a.getRecord()

    return res.render("home", {
        title: "Welcome",
        authenticated: req.authenticated,
        a: a
    })
})

module.exports = router
