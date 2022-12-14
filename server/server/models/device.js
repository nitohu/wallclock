const jwt = require("jsonwebtoken")
const db = require("../db")
const config = require("../config")
const logger = require("../logger")
const https = require("http")
const { validModes, modes } = require("./device_mode")
const { DeviceModeSettings } = require("./mode_settings")


class Device {
    // Private fields
    #id = 0
    #createDate = null
    #writeDate = null
    #lastConn = null
    #token = ""
    #mode = ""
    // TODO: remove me after completely moved to ModeSettings
    #color = ""
    #isOn = true
    #brightness = 50
    #settings = []
    // Public fields
    name = ""
    ip = ""
    active = true
    mode = modes[0]
    color = ""

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
    /**
     * Get information about the current mode that is set
     * @returns DeviceMode record
     */
    getMode() { 
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i]
            if (mode.name == this.#mode) {
                return mode
            }
        }
        // fallback if field in db is empty
        if (modes.length > 0) return modes[0]
        return null
    }
    getColor() { return this.#color }
    getBrightness() { return this.#brightness }
    /**
     * Get the settings for the current mode
     * @returns ModeSettings record
     */
    getCurrentModeSettings() {
        for (let i = 0; i < this.#settings.length; i++) {
            if (this.#settings[i].getName() == this.#mode) return this.#settings[i]
        }
        if (this.#settings.length > 0) return this.#settings[0]
        return undefined
    }
    isOn() { return this.#isOn }

    setBrightness(brightness) {
        let br = Number.parseFloat(brightness)
        if (br === NaN) return;
        if (br > 100.0) br = 100.0
        else if (br < 0.0) br = 0.0
        this.#brightness = br;
    }

    updateLastConn() {
        this.#lastConn = new Date()
    }

    turnOn() { this.#isOn = true }
    turnOff() { this.#isOn = false }

    // Create database record
    async create() {
        if (this.#id > 0)
            throw new Error("Device already has an id.")
        if (String(this.name).trim() === "")
            throw new Error("Device has no name.")

        this.#createDate = new Date()
        this.#writeDate = new Date()
        const q = "INSERT INTO device(active, name, ip, token, create_date, write_date, last_conn, is_on, brightness) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id"
        let r = await db.query(q, [this.active, this.name, this.ip, this.token, this.#createDate, this.#writeDate, this.#lastConn, this.#isOn, this.#brightness])
        if (!r || r.rowCount === 0)
            throw new Error("Something bad happened.")
        
        r = r.rows[0]
        this.#id = r.id

        // Create all modes for the device
        for (let i = 0; i < validModes.length; i++) {
            try {
                const m = new DeviceModeSettings(validModes[i], this.#id)
                await m.create()
                this.#settings.push(m)
            } catch (e) {
                logger.warn(`Error while creating mode ${validModes[i]}: ${e}`)
            }
        }
        this.mode = this.getMode()
    }
    // Write to database
    async write() {
        if (this.#id < 1)
            throw new Error("Device has no id, cannot write to database.")
        if (String(this.name).trim() === "")
            throw new Error("Device has no name.")
        
        this.#writeDate = new Date()
        const q = "UPDATE device SET name=$2, ip=$3, active=$4, token=$5, write_date=$6, last_conn=$7, is_on=$8, brightness=$9 WHERE id=$1 RETURNING id"
        let r = await db.query(q, [this.#id, this.name, this.ip, this.active, this.token, this.#writeDate, this.#lastConn, this.#isOn, this.#brightness])
        if (!r)
            throw new Error("Something bad happened.")
        if (r.rowCount === 0)
            throw new Error("No row was affected.")
        
        this.mode = this.getMode()
    }

    // Delete from database
    async delete() {
        if (this.#id < 1)
            throw new Error("Device has no id, cannot delete from database.")
        // Delete settings
        let q = "DELETE FROM mode_settings where device_id=$1"
        let r = await db.query(q, [this.#id])
        if (!r)
            throw new Error(`There was an error while deleting the mode settings of device ${this.#id}`)
        // Delete device
        q = "DELETE FROM device WHERE id=$1 RETURNING *"
        r = await db.query(q, [this.#id])
        if (!r)
            throw new Error("An unexpected error occured")
        if (r.rowCount == 0)
            throw new Error("No row was affected.")
        // TODO: Delete mode settings if not cascading
        return r.rows[0]
    }

    /**
     * Fetches all settings from the database linked to the device
     */
    async fetchSettings() {
        // NOTE: Can be put in a static function in ModeSettings ().FetchSettings(device_id))
        if (this.#id <= 0)
            throw new Error("Invalid ID.")
        this.#settings = await DeviceModeSettings.GetSettings(this.#id)
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
        this.#mode = r.mode
        this.#color = r.color
        this.#isOn = r.is_on
        this.#brightness = r.brightness

        this.mode = this.getMode()
        this.color = this.#color

        await this.fetchSettings()
    }

    async findByToken(token) {
        if (token === undefined || String(token).concat() === "")
            throw new Error("Please enter a valid token.")
        
        // NOTE: SQL Injection possible? ; depends on db.query function
        let r = await db.query("SELECT * FROM device WHERE token=$1 AND active=true", [token])
        if (!r || r.rowCount === 0)
            throw new Error(`No device with ${token} found.`)
        
        r = r.rows[0]
        this.#id = r.id
        this.name = r.name
        this.ip = r.ip
        this.active = r.active
        this.token = r.token
        this.#createDate = r.create_date
        this.#writeDate = r.write_date
        this.#lastConn = r.last_conn
        this.#mode = r.mode
        this.#color = r.color
        this.#isOn = r.is_on
        this.#brightness = r.brightness

        this.mode = this.getMode()
        this.color = this.#color

        await this.fetchSettings()
    }
    
    generateToken() {
        this.#token = jwt.sign({ id: this.#id.toString() }, config.apiSecret)

        return this.#token
    }

    // TODO: Can probably be improved by taking a dictionary for mode settings
    async updateMode(mode, color, color2, color3, color4, isOn, brightness, delay, randomColor, showSeconds, rotate, useGradient) {
        if (this.#id < 1) throw new Error("Device has no id, cannot write to database.")
        if (!validModes.includes(mode)) throw new Error("Please provide a valid mode.")

        // FIXME: Security vuln. ; color isn't checked ; SQL Injection possible
        this.#mode = mode
        this.#color = color
        if (typeof(isOn) == "boolean")
            this.#isOn = isOn
        this.setBrightness(brightness)

        const q = "UPDATE device SET mode=$2, color=$3, is_on=$4, brightness=$5 WHERE id=$1 RETURNING id"
        let r = await db.query(q, [this.#id, this.#mode, this.#color, this.#isOn, this.#brightness])
        if (!r) throw new Error("Something bad happened.")
        if (r.rowCount === 0) throw new Error("No row was affected.")

        // Update device specific settings
        const modeSettings = this.getCurrentModeSettings()
        modeSettings.setSpeed(delay)
        modeSettings.setColor(color)
        modeSettings.setColor2(color2)
        modeSettings.setColor3(color3)
        modeSettings.setColor4(color4)
        modeSettings.setRandomColor(randomColor)
        modeSettings.setShowSeconds(showSeconds)
        modeSettings.setRotate(rotate)
        modeSettings.setUseGradient(useGradient)
        await modeSettings.write()

        this.mode = this.getMode()
    }

    push() {
        // Validate ip
        if (!this.ip.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}/)) {
            return;
        }
        let data = {
            mode: this.#mode,
            // color: this.#color,
            on: this.#isOn,
            brightness: this.#brightness
            // timestamp: Date.now()
        }
        if (this.mode.isConfigurable) {
            const modeSettings = this.getCurrentModeSettings()
            if (this.mode.configs.includes("color")) {
                data.color = modeSettings.getColor()
            }
            if (this.mode.configs.includes("color2")) {
                data.color2 = modeSettings.getColor2()
            }
            if (this.mode.configs.includes("color3")) {
                data.color3 = modeSettings.getColor3()
            }
            if (this.mode.configs.includes("color4")) {
                data.color4 = modeSettings.getColor4()
            }
            if (this.mode.configs.includes("randomColor")) {
                data.randomColor = modeSettings.getRandomColor()
            }
            if (this.mode.configs.includes("showSeconds")) {
                data.showSeconds = modeSettings.getShowSeconds()
            }
            if (this.mode.configs.includes("speed")) {
                data.delay = modeSettings.getSpeed()
            }
            if (this.mode.configs.includes("rotate")) {
                data.rotate = modeSettings.getRotate()
            }
            if (this.mode.configs.includes("useGradient")) {
                data.useGradient = modeSettings.getUseGradient()
            }
        }
        data = JSON.stringify(data)
        let ip = this.ip, port = 80;
        if (this.ip.includes(":")) {
            try {
                const a = this.ip.split(":")
                ip = a[0]
                port = Number.parseInt(a[1])
            } catch(e) {
                logger.warn(e)
            }
        }
        const o = {
            hostname: ip,
            port,
            path: "/",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": data.length,
            },
        }
        const req = https.request(o, res => {
            logger.info(`clock's status code: ${res.statusCode}`)
        })
        req.on("error", err => {
            logger.warn(`Probably expected; ${err}`)
        })
        logger.info(`Sending ${data} to ${this.name} (${this.ip})`)
        req.write(data)
        req.end()
    }

    static async FindByID(id) {
        let d = new Device()
        await d.findByID(id)
        return d
    }

    static async FindByToken(token) {
        let d = new Device()
        await d.findByToken(token)
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
            d.#mode = r.rows[i].mode
            d.#color = r.rows[i].color
            
            d.mode = d.getMode()

            devices.push(d)
        }
        return devices
    }
}

module.exports = Device
