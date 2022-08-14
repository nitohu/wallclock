const db = require("../db")
const logger = require("../logger")

class Device {
    // Private fields
    #id = 0
    // Public fields
    name = ""
    ip = ""

    constructor(name, ip) {
        if (name !== undefined) this.name = name
        if (ip !== undefined) this.ip = ip
    }
    
    // Public Methods
    getID() { return this.#id }

    // Create database record
    async create() {
        if (this.#id > 0)
            throw new Error("Device already has an id.")
        if (String(this.name).trim() === "")
            throw new Error("Device has no name.")

        let r = await db.query("INSERT INTO device(name, ip) VALUES ($1, $2) RETURNING *", [this.name, this.ip])
        if (!r || r.rowCount === 0)
            throw new Error("Something bad happened.")
        
        r = r.rows[0]
        this.#id = r.id
        this.name = r.name
        this.ip = r.ip
    }
    // Write to database
    async write() {
        if (this.#id < 1)
            throw new Error("Device has no id, cannot write to database.")
        if (String(this.name).trim() === "")
            throw new Error("Device has no name.")
        
        let r = await db.query("UPDATE device SET name=$2, ip=$3 WHERE id=$1 RETURNING id", [this.#id, this.name, this.ip])
        if (!r)
            throw new Error("Something bad happened.")
        if (r.rowCount === 0)
            throw new Error("No row was affected.")
        
        console.log(r)
    }

    // FindByID
    async findByID(id) {
        if (id < 1)
            throw new Error("Please enter a valid id.")
        
        let r = await db.query("SELECT * FROM device WHERE id=$1", [id])
        if (!r || r.rowCount === 0)
            throw new Error(`No device with id ${id} found.`)
        
        r = r.rows[0]
        this.#id = r.id
        this.name = r.name
        this.ip = r.ip
    }

    // Gets all devices from database and returns them
    static async GetAll() {
        const r = await db.query("SELECT * FROM device")
        if (!r) throw new Error("Something bad happened.")

        const devices = []
        for (let i = 0; i < r.rowCount; i++) {
            const d = new Device(r.rows[i].name, r.rows[i].ip)
            d.#id = r.rows[i].id
            
            devices.push(d)
        }
        return devices
    }
}

module.exports = Device
