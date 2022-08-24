const db = require("../db")

const auth = async (req, res, next) => {
    req.authenticated = false
    if (req.session && req.session.authenticated && req.session.settings) {
        req.authenticated = true
        return next()
    }

    // User is not authenticated
    return res.redirect("/login")
}

module.exports = auth
