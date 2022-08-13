const db = require("../db")

class Authentication {
    // Private fields
    #id = 0
    #token = null
    // Public fields
    active = false
    device_token = false
    device_id = null

    constructor(name, token) {
        this.name = name
        // TODO: hash token
        this.#token = token
    }

    getID() {
        return this.#id
    }

    async getRecord() {
        if (this.name === "" || this.#token === "") return

        const res = await db.query("SELECT * FROM auth WHERE name=$1 AND token=$2", [this.name, this.#token])
        if (res.rowCount == 0) {
            console.warn("No record found.")
            return
        }

        const r = res.rows[0]
        this.active = r.active
        this.#id = r.id
        this.#token = r.token
        this.name = r.name
        this.device_id = r.device_id
        this.device_token = r.device_token
    }

}

module.exports = Authentication
