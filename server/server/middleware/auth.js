const db = require("../db")

const auth = async (req, res, next) => {
    req.authenticated = false

    next()
}

module.exports = auth
