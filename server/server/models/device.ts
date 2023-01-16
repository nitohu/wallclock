import jwt from "jsonwebtoken"
import db from "../db"
import config from '../config'
import logger from "../logger"
import https from "http"
import { validModes, modes, DeviceMode } from "./device_mode"
import { DeviceModeSettings } from "./mode_settings"

type DeviceSettings = {
    mode: string
    color?: string
    color2?: string
    color3?: string
    color4?: string
    isOn?: boolean
    brightness?: number
    delay?: number
    randomColor?: boolean
    showSeconds?: boolean
    rotate?: boolean
    useGradient?: boolean
}


class Device {
    // Private fields
    #id: number
    #createDate: Date | undefined
    #writeDate: Date | undefined
    #lastConn: Date | undefined
    #token: string
    #mode: string
    #isOn: boolean
    #brightness: number
    #settings: DeviceModeSettings[]
    // Public fields
    name: string
    ip: string
    active: boolean
    mode: DeviceMode

    constructor(name: string, ip: string) {
        this.#id = 0
        this.name = name
        this.ip = ip
        this.#brightness = 50
        this.#isOn = true
        this.active = true
        this.mode = modes[0]
        this.#token = ""
        this.#mode = this.mode.name
        this.#settings = []
    }
    
    // Public Methods
    getID(): number { return this.#id }
    getCreateDate(): Date | undefined { return this.#createDate }
    getCreateDateStr(): string {
        return this.#createDate ? this.#createDate.toLocaleString() : ""
    }
    getWriteDate(): Date | undefined { return this.#writeDate }
    getWriteDateStr(): string {
        return this.#writeDate ? this.#writeDate.toLocaleString() : ""
    }
    getLastConn(): Date | undefined { return this.#lastConn }
    getLastConnStr(): string {
        return (this.#lastConn) ? this.#lastConn.toLocaleString() : ""
    }
    getToken(): string { return this.#token }
    /**
     * Get information about the current mode that is set
     * @returns DeviceMode record
     */
    getMode(): DeviceMode { 
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i]
            if (mode.name == this.#mode) {
                return mode
            }
        }
        // fallback if field in db is empty
        return modes[0]
    }
    getBrightness(): number { return this.#brightness }
    /**
     * Get the settings for the current mode
     * @returns ModeSettings record
     */
    getCurrentModeSettings(): DeviceModeSettings | undefined {
        for (let i = 0; i < this.#settings.length; i++) {
            if (this.#settings[i].getName() == this.#mode) return this.#settings[i]
        }
        if (this.#settings.length > 0) return this.#settings[0]
        return undefined
    }
    isOn(): boolean { return this.#isOn }

    setBrightness(brightness: number) {
        if (brightness > 100.0) this.#brightness = 100.0
        else if (brightness < 0.0) this.#brightness = 0.0
        else this.#brightness = brightness;
    }
    setToken(token: string) {
        // TODO: Add some kind of verification for the token before setting it
        this.#token = token
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
        if (this.name.trim() === "")
            throw new Error("Device has no name.")

        this.#createDate = new Date()
        this.#writeDate = new Date()
        const q = "INSERT INTO device(active, name, ip, token, create_date, write_date, last_conn, is_on, brightness) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id"
        let res = await db.query(q, [this.active, this.name, this.ip, this.#token, this.#createDate, this.#writeDate, this.#lastConn, this.#isOn, this.#brightness])
        if (!res || res.rowCount === 0)
            throw new Error("Something bad happened.")
        
        let r = res.rows[0]
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
        if (this.name.trim() === "")
            throw new Error("Device has no name.")
        
        this.#writeDate = new Date()
        const q = "UPDATE device SET name=$2, ip=$3, active=$4, token=$5, write_date=$6, last_conn=$7, is_on=$8, brightness=$9 WHERE id=$1 RETURNING id"
        let r = await db.query(q, [this.#id, this.name, this.ip, this.active, this.#token, this.#writeDate, this.#lastConn, this.#isOn, this.#brightness])
        if (!r)
            throw new Error("Something bad happened.")
        if (r.rowCount === 0)
            throw new Error("No row was affected.")
        
        this.mode = this.getMode()
    }

    // Delete from database
    async delete(): Promise<any> {
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
        return r.rows[0]
    }

    /**
     * Fetches all settings from the database linked to the device
     */
    async fetchSettings() {
        if (this.#id <= 0)
            throw new Error("Invalid ID.")
        this.#settings = await DeviceModeSettings.GetSettings(this.#id)
    }

    // FindByID
    async findByID(id: number) {
        if (id < 1)
            throw new Error("Please enter a valid id.")
        
        let res = await db.query("SELECT * FROM device WHERE id=$1", [id])
        if (!res || res.rowCount === 0)
            throw new Error(`No device with id ${id} found.`)
        
        let r = res.rows[0]
        this.#id = r.id
        this.name = r.name
        this.ip = r.ip
        this.active = r.active
        this.#token = r.token
        this.#createDate = r.create_date
        this.#writeDate = r.write_date
        this.#lastConn = r.last_conn
        this.#mode = r.mode
        this.#isOn = r.is_on
        this.#brightness = r.brightness

        this.mode = this.getMode()

        await this.fetchSettings()
    }

    async findByToken(token: string) {
        if (token.concat() === "")
            throw new Error("Please enter a valid token.")
        
        let res = await db.query("SELECT * FROM device WHERE token=$1 AND active=true", [token])
        if (!res || res.rowCount === 0)
            throw new Error(`No device with ${token} found.`)
        
        let r = res.rows[0]
        this.#id = r.id
        this.name = r.name
        this.ip = r.ip
        this.active = r.active
        this.#token = r.token
        this.#createDate = r.create_date
        this.#writeDate = r.write_date
        this.#lastConn = r.last_conn
        this.#mode = r.mode
        this.#isOn = r.is_on
        this.#brightness = r.brightness

        this.mode = this.getMode()

        await this.fetchSettings()
    }
    
    generateToken(): string {
        this.#token = jwt.sign({ id: this.#id.toString() }, config.apiSecret)

        return this.#token
    }

    async updateMode(settings: DeviceSettings) {
        if (this.#id < 1) throw new Error("Device has no id, cannot write to database.")
        if (!validModes.includes(settings.mode)) throw new Error("Please provide a valid mode.")

        this.#mode = settings.mode
        if (settings.isOn !== undefined)
            this.#isOn = settings.isOn
        if (settings.brightness !== undefined)
            this.setBrightness(settings.brightness)

        const q = "UPDATE device SET mode=$2, is_on=$3, brightness=$4 WHERE id=$1 RETURNING id"
        let r = await db.query(q, [this.#id, this.#mode, this.#isOn, this.#brightness])
        if (!r) throw new Error("Something bad happened.")
        if (r.rowCount === 0) throw new Error("No row was affected.")

        // Update device specific settings
        const modeSettings = this.getCurrentModeSettings()
        if (modeSettings === undefined)
            throw new Error(`Did not find any settings for device ${this.name} with mode ${this.#mode}`)
        modeSettings.setSpeed(settings.delay)
        modeSettings.setColor(settings.color)
        modeSettings.setColor2(settings.color2)
        modeSettings.setColor3(settings.color3)
        modeSettings.setColor4(settings.color4)
        modeSettings.setRandomColor(settings.randomColor)
        modeSettings.setShowSeconds(settings.showSeconds)
        modeSettings.setRotate(settings.rotate)
        modeSettings.setUseGradient(settings.useGradient)
        await modeSettings.write()

        this.mode = this.getMode()
    }

    push() {
        // Validate ip
        if (!this.ip.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}/)) {
            return;
        }
        let data: any = {
            mode: this.#mode,
            // color: this.#color,
            on: this.#isOn,
            // Ugly bug workaround, because js will convert it to string anyways which will cause problems for the clock
            brightness: Number.parseInt(this.#brightness.toString())
            // timestamp: Date.now()
        }
        if (this.mode !== undefined && this.mode.isConfigurable) {
            const modeSettings = this.getCurrentModeSettings()
            if (modeSettings !== undefined) {
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
                    // Ugly workaround, will be returned as string by javascript
                    data.delay = Number.parseInt(modeSettings.getSpeed().toString())
                }
                if (this.mode.configs.includes("rotate")) {
                    data.rotate = modeSettings.getRotate()
                }
                if (this.mode.configs.includes("useGradient")) {
                    data.useGradient = modeSettings.getUseGradient()
                }
            }
        }
        let dataStr = JSON.stringify(data)
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
                "Content-Length": dataStr.length,
            },
        }
        const req = https.request(o, res => {
            logger.info(`clock's status code: ${res.statusCode}`)
        })
        req.on("error", err => {
            logger.warn(`Probably expected; ${err}`)
        })
        logger.info(`Sending ${dataStr} to ${this.name} (${this.ip})`)
        req.write(dataStr)
        req.end()
    }

    static async FindByID(id: number): Promise<Device> {
        let d = new Device("", "")
        await d.findByID(id)
        return d
    }

    static async FindByToken(token: string): Promise<Device> {
        let d = new Device("", "")
        await d.findByToken(token)
        return d
    }

    // Gets all devices from database and returns them
    static async GetAll(): Promise<Device[]> {
        const r = await db.query("SELECT * FROM device")
        if (!r) throw new Error("Something bad happened.")

        const devices: Device[] = []
        for (let i = 0; i < r.rowCount; i++) {
            const d = new Device(r.rows[i].name, r.rows[i].ip)
            d.#id = r.rows[i].id
            d.active = r.rows[i].active
            d.#token = r.rows[i].token
            d.#createDate = r.rows[i].create_date
            d.#writeDate = r.rows[i].write_date
            d.#lastConn = r.rows[i].last_conn
            d.#mode = r.rows[i].mode
            
            d.mode = d.getMode()

            devices.push(d)
        }
        return devices
    }
}

export { 
    Device,
    DeviceSettings
}
