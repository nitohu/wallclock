const { Pool } = require("pg")
const config = require("../config")
const logger = require("../logger")

// Set up & connect to database, stop program if it fails
const pool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPass,
    database: config.dbDatabase
})
pool.connect().then(() => {
    logger.info(`Successfully connected to database ${config.dbDatabase} on ${config.dbHost}`)
}).catch(err => {
    logger.error(`There was an error while connecting to the database: ${err}`)
    process.exit(1)
})

// Do we always open a new pool (& probably not closing it) when importing this file?
// From reading the logs it does not seem to do that
module.exports = {
    // pool,
    query: async (text, params, cb) => {
        const s = Date.now()
        const r = await pool.query(text, params)
        const d = Date.now() - s
        logger.info(`query "${text}" executed in ${d}ms (Records affected: ${ r.rowCount })`)
        return r
    }
    // TODO: Implement queryOne function
}
