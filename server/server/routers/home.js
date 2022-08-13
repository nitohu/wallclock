const express = require("express")
// const auth = require("../middleware/auth")

const router = express.Router()

router.get("/", (req, res) => {
    return res.render("home", {
        title: "Welcome",
        authenticated: req.authenticated
    })
})

module.exports = router
