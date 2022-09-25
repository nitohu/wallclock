const db = require("../db")
const { validModes } = require("./device_mode")

/**
 * DeviceModeSettings stores settings for specific modes for each devices in the database
 */
class DeviceModeSettings {
    #deviceId = 0
    #name = ""
    #speed = 10
    #color = ""
    #randomColor = false
    #showSeconds = true
    #rotate = true

    constructor(name, deviceID) {
        if (!validModes.includes(name))
            throw new Error("Invalid name.")
        this.#name = name
        this.#deviceId = deviceID
    }

    getName() { return this.#name }
    getSpeed() {
        return Number.parseInt(this.#speed)
    }
    getColor() { return this.#color }
    getRandomColor() { return this.#randomColor }
    getShowSeconds() { return this.#showSeconds }
    getRotate() { return this.#rotate }
    setSpeed(speed) {
        let s = Number.parseInt(speed)
        if (s > 50) s = 50
        else if (s < 0) s = 0
        this.#speed = s
    }
    setColor(color) {
        // TODO: Add regex validating hex
        this.#color = color
    }
    setRandomColor(rc) {
        if (typeof(rc) !== "boolean") return;
        this.#randomColor = rc
    }
    setShowSeconds(show) {
        if (typeof(show) !== "boolean") return;
        this.#showSeconds = show
    }
    setRotate(rotate) {
        if (typeof(rotate) !== "boolean") return;
        this.#rotate = rotate
    }

    // Create database record
    async create() {
        if (this.#deviceId <= 0 ||
            !validModes.includes(this.#name))
            throw new Error("Device ID or name invalid.")

        const q = "INSERT INTO mode_settings(device_id, name, speed, color, random_color, show_seconds, rotate) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        let r = await db.query(q, [this.#deviceId, this.#name, Number.parseInt(this.#speed), this.#color, this.#randomColor, this.#showSeconds, this.#rotate])
        if (!r || r.rowCount === 0)
            throw new Error("Something bad happened.")
        
        r = r.rows[0]
    }
    // Write to database
    async write() {
        if (this.#deviceId <= 0)
            throw new Error("Device ID must be greater than 0.")
        if (!validModes.includes(this.#name))
            throw new Error("Invalid name.")
        
        const q = "UPDATE mode_settings SET speed=$3, color=$4, random_color=$5, show_seconds=$6, rotate=$7 WHERE name=$2 AND device_id=$1"
        let r = await db.query(q, [this.#deviceId, this.#name, Number.parseInt(this.#speed), this.#color, this.#randomColor, this.#showSeconds, this.#rotate])
        if (!r)
            throw new Error("Something bad happened.")
        if (r.rowCount === 0)
            throw new Error("No row was affected.")
        
    }

    // Delete from database
    async delete() {
        if (this.#deviceId <= 0)
            throw new Error("Device ID must be greater than 0.")
        const q = "DELETE FROM mode_settings WHERE device_id=$1 AND name=$2"
        let r = await db.query(q, [this.#deviceId, this.#name])
        if (!r)
            throw new Error("An unexpected error occured")
        if (r.rowCount == 0)
            throw new Error("No row was affected.")
        
        return r.rows[0]
    }

    static async GetSettings(device_id) {
        if (device_id <= 0)
            throw new Error("Device ID must be greater than 0")
        
        const q = "SELECT * FROM mode_settings WHERE device_id=$1"
        let res = await db.query(q, [device_id])
        if (!res)
            throw new Error("Something bad happened")
        
        const settings = []
        for (let i = 0; i < res.rowCount; i++) {
            const row = res.rows[i]
            const s = new DeviceModeSettings(row.name, row.deviceID)
            s.#speed = row.speed
            s.#color = row.color
            s.#randomColor = row.random_color
            s.#showSeconds = row.show_seconds
            s.#rotate = row.rotate
            settings.push(s)
        }
        return settings
    }

}

module.exports = {
    validModes,
    DeviceModeSettings
}
