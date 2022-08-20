const jwt = require("jsonwebtoken")
const db = require("../db")
const config = require("../config")
const logger = require("../logger")

class Device {
    // Private fields
    #id = 0
    #createDate = null
    #writeDate = null
    #lastConn = null
    #token = ""
    // Public fields
    name = ""
    ip = ""
    active = true

    constructor(name, ip) {
        if (name !== undefined) this.name = name
        if (ip !== undefined) this.ip = ip
    }
    
    // Public Methods
    getID() { return this.#id }
    getCreateDate() { return this.#createDate }
    getCreateDateStr() { return this.#createDate.toLocaleString() }
    getWriteDate() { return this.#writeDate }
    getWriteDateStr() { return this.#writeDate.toLocaleString() }
    getLastConn() { return this.#lastConn }
    getLastConnStr() { return (this.#lastConn) ? this.#lastConn.toLocaleString() : undefined }
    getToken() { return this.#token }

    // Create database record
    async create() {
        if (this.#id > 0)
            throw new Error("Device already has an id.")
        if (String(this.name).trim() === "")
            throw new Error("Device has no name.")

        this.#createDate = new Date()
        this.#writeDate = new Date()
        const q = "INSERT INTO device(active, name, ip, token, create_date, write_date, last_conn) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id"
        let r = await db.query(q, [this.active, this.name, this.ip, this.token, this.#createDate, this.#writeDate, this.#lastConn])
        if (!r || r.rowCount === 0)
            throw new Error("Something bad happened.")
        
        r = r.rows[0]
        this.#id = r.id
    }
    // Write to database
    async write() {
        if (this.#id < 1)
            throw new Error("Device has no id, cannot write to database.")
        if (String(this.name).trim() === "")
            throw new Error("Device has no name.")
        
        this.#writeDate = new Date()
        const q = "UPDATE device SET name=$2, ip=$3, active=$4, token=$5, write_date=$6, last_conn=$7 WHERE id=$1 RETURNING id"
        let r = await db.query(q, [this.#id, this.name, this.ip, this.active, this.token, this.#writeDate, this.#lastConn])
        if (!r)
            throw new Error("Something bad happened.")
        if (r.rowCount === 0)
            throw new Error("No row was affected.")
        
    }

    // Delete from database
    async delete() {
        if (this.#id < 1)
            throw new Error("Device has no id, cannot delete from database.")
        const q = "DELETE FROM device WHERE id=$1 RETURNING *"
        let r = await db.query(q, [this.#id])
        if (!r)
            throw new Error("An unexpected error occured")
        if (r.rowCount == 0)
            throw new Error("No row was affected.")
        
        return r.rows[0]
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
        this.active = r.active
        this.token = r.token
        this.#createDate = r.create_date
        this.#writeDate = r.write_date
        this.#lastConn = r.last_conn
    }
    
    generateToken() {
        this.#token = jwt.sign({ id: this.#id.toString() }, config.apiSecret)

        return this.#token
    }

    static async FindByID(id) {
        let d = new Device()
        await d.findByID(id)
        return d
    }

    // Gets all devices from database and returns them
    static async GetAll() {
        const r = await db.query("SELECT * FROM device")
        if (!r) throw new Error("Something bad happened.")

        const devices = []
        for (let i = 0; i < r.rowCount; i++) {
            const d = new Device(r.rows[i].name, r.rows[i].ip)
            d.#id = r.rows[i].id
            d.active = r.rows[i].active
            d.token = r.rows[i].token
            d.#createDate = r.rows[i].create_date
            d.#writeDate = r.rows[i].write_date
            d.#lastConn = r.rows[i].last_conn
            
            devices.push(d)
        }
        return devices
    }
}

module.exports = Device
