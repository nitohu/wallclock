import db from "../db"
import bcrypt from "bcryptjs"

class Settings {
    // Private
    #id: number
    #createDate: Date | undefined
    #authenticated: boolean
    #passwd: string
    // Public
    username: string
    timezone: string
    useLoginMask: boolean
    darkMode: boolean

    constructor() {
        this.#id = 0
        this.#authenticated = false
        this.username = ""
        this.timezone = ""
        this.#passwd = ""
        this.useLoginMask = true
        this.darkMode = true
    }
    // Methods
    async authenticate(passwd: string) {
        const r = await db.queryOne("SELECT * FROM settings ORDER BY id DESC")
        if (!r || r.rowCount == 0) throw new Error("No record in settings found.")

        // Authenticate
        const isMatch: boolean = await bcrypt.compare(String(passwd), r.passwd)
        if (!isMatch) throw new Error("Error while authenticating.")

        this.#id = r.id
        this.#createDate = r.create_date
        this.username = r.name
        this.timezone = r.timezone
        this.useLoginMask = r.use_login_mask
        this.darkMode = r.dark_mode

        this.#authenticated = true
    }

    async getLatestSettings() {
        const r = await db.queryOne("SELECT * FROM settings ORDER BY id DESC")
        if (!r || r.rowCount == 0) throw new Error("No record in settings found.")

        this.#id = r.id
        this.#createDate = r.create_date
        this.username = r.name
        this.timezone = r.timezone
        this.useLoginMask = r.use_login_mask
        this.darkMode = r.dark_mode
        this.#passwd = r.passwd
    }

    async save() {
        if (this.username === "") throw new Error("Username is a required field for settings.")
        if (this.timezone === "") this.timezone = "de_DE"

        this.#createDate = new Date()
        const q = "INSERT INTO settings(create_date, name, passwd, timezone, use_login_mask, dark_mode) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id"
        let r = await db.query(q, [this.#createDate, this.username, this.#passwd, this.timezone, this.useLoginMask, this.darkMode])
        if (!r || r.rowCount === 0) throw new Error("Something bad happened while trying to save the settings.")

        this.#id = r.rows[0].id
    }

    static async Authenticate(passwd: string): Promise<Settings> {
        const s = new this()
        await s.authenticate(passwd)
        return s
    }
    static async GetLatestSettings(): Promise<Settings> {
        const s = new this()
        await s.getLatestSettings()
        return s
    }

    isAuthenticated(): boolean { return this.#authenticated }
    getID(): number { return this.#id }
    getCreateDate(): Date | undefined { return this.#createDate }

    async setPassword(passwd: string) {
        if (passwd.length < 5) throw new Error("Password must be at least 5 characters long.")

        const pw: string = await bcrypt.hash(passwd, 10)
        this.#passwd = pw
    }

}

export default Settings
