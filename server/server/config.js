const config = {
    // Database
    dbUser: "wallclock",
    dbHost: "db",
    dbPort: 5432,
    dbDatabase: "wallclock",
    dbPass: "secretpassword",

    // Website settings
    sessionSecret: "supersecret",
    ssl: false
}

module.exports = config
