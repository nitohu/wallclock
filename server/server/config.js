const config = {
    // Database
    dbUser: "wallclock",
    dbHost: "db",
    dbPort: 5432,
    dbDatabase: "wallclock",
    dbPass: "secretpassword",

    // Website settings
    sessionSecret: "supersecret",
    ssl: false,
    timezone: "Europe/Berlin",
    apiSecret: "supersecret2"
}

module.exports = config
