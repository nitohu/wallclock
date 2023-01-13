import db from "../db"
import bcrypt from "bcryptjs"

// TODO: Implement save/create method
class Settings {
    // Private
    #id: number
    #createDate: Date | undefined
    #authenticated: boolean
    // TODO: Add option to enable/disable password protection
    #useLoginMask: boolean
    // Public
    username: string
    timezone: string

    constructor() {
        this.#id = 0
        this.#authenticated = false
        this.username = ""
        this.timezone = ""
        this.#useLoginMask = true
    }
    // Methods
    async authenticate(passwd: string) {
        const r = await db.queryOne("SELECT * FROM settings ORDER BY id DESC")
        if (!r) throw new Error("No record in settings found.")

        // Authenticate
        const isMatch: boolean = await bcrypt.compare(String(passwd), r.passwd)
        if (!isMatch) throw new Error("Error while authenticating.")

        this.#id = r.id
        this.#createDate = r.create_date
        this.username = r.name
        this.timezone = r.timezone

        this.#authenticated = true
    }
    static async Authenticate(passwd: string): Promise<Settings> {
        const s = new this()
        await s.authenticate(passwd)
        return s
    }

    isAuthenticated(): boolean { return this.#authenticated }
    getID(): number { return this.#id }
    getCreateDate(): Date | undefined { return this.#createDate }

}

export default Settings
