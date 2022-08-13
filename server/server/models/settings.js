const db = require("../db")
const bcrypt = require("bcryptjs")

// TODO: Implement save/create method
class Settings {
    // Private
    #id = 0
    #createDate = null
    #authenticated = false

    // Public
    username = ""
    timezone = ""

    constructor() {}
    // Methods
    async authenticate(passwd) {
        const res = await db.query("SELECT * FROM settings ORDER BY id DESC LIMIT 1")
        if (res.rowCount == 0) throw new Error("No record in settings found.")

        const r = res.rows[0]
        // Authenticate
        const isMatch = await bcrypt.compare(String(passwd), r.passwd)
        if (!isMatch) throw new Error("Error while authenticating.")

        this.#id = r.id
        this.#createDate = r.create_date
        this.username = r.name
        this.timezone = r.timezone

        this.authenticated = true
    }
    static async Authenticate(passwd) {
        const s = new this()
        await s.authenticate(passwd)
        return s
    }

    isAuthenticated() { return this.#authenticated }
    getID() { return this.#id }
    getCreateDate() { return this.#createDate }

}

module.exports = Settings
