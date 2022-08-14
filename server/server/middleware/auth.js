const db = require("../db")

const auth = async (req, res, next) => {
    req.authenticated = false
    if (req.session && req.session.authenticated && req.session.settings) {
        req.authenticated = true
        return next()
    }

    // User is not authenticated
    // NOTE: might be changed to redirect to /login when route is existing
    return res.render("login", {
        title: "Welcome",
        error: false
    })
}

module.exports = auth
