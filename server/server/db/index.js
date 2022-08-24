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

const query = async (text, params) => {
    const s = Date.now()
    const r = await pool.query(text, params)
    const d = Date.now() - s
    logger.info(`query "${text}" executed in ${d}ms (Records affected: ${ r.rowCount })`)
    return r
}
const queryOne = async (text, params) => {
    if (!text.toLowerCase().includes("limit")) text += " LIMIT 1"
    const r = await query(text, params)
    return r.rowCount < 1 ? null : r.rows[0]
} 

module.exports = {
    // pool,
    query,
    queryOne
}
