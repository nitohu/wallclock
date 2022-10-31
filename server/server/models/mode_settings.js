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
    #color2 = ""
    #color3 = ""
    #color4 = ""
    #randomColor = false
    #showSeconds = true
    #rotate = true
    #useGradient = false

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
    getColor2() { return this.#color2 }
    getColor3() { return this.#color3 }
    getColor4() { return this.#color4 }
    getRandomColor() { return this.#randomColor }
    getShowSeconds() { return this.#showSeconds }
    getRotate() { return this.#rotate }
    getUseGradient() { return this.#useGradient }
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
    setColor2(color) {
        // TODO: Add regex validating hex
        this.#color2 = color
    }
    setColor3(color) {
        // TODO: Add regex validating hex
        this.#color3 = color
    }
    setColor4(color) {
        // TODO: Add regex validating hex
        this.#color4 = color
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
    setUseGradient(ug) {
        if (typeof(ug) !== "boolean") return;
        this.#useGradient = ug
    }

    // Create database record
    async create() {
        if (this.#deviceId <= 0 ||
            !validModes.includes(this.#name))
            throw new Error("Device ID or name invalid.")

        const q = "INSERT INTO mode_settings(device_id, name, speed, color, color2, color3, color4, random_color, show_seconds, rotate, use_gradient) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        let r = await db.query(q, [
            this.#deviceId,
            this.#name,
            Number.parseInt(this.#speed),
            this.#color,
            this.#color2,
            this.#color3,
            this.#color4,
            this.#randomColor,
            this.#showSeconds,
            this.#rotate,
            this.#useGradient
        ])
        if (!r || r.rowCount === 0)
            throw new Error("Something bad happened.")
        
        r = r.rows[0]
    }
    // Write to database
    async write() {
        if (this.#deviceId === undefined)
            throw new Error("Device ID is undefined.")
        if (this.#deviceId <= 0)
            throw new Error("Device ID must be greater than 0.")
        if (!validModes.includes(this.#name))
            throw new Error("Invalid name.")
        
        console.log(`${this.#deviceId} : ${this.#name}`)
        const q = "UPDATE mode_settings SET speed=$3, color=$4, color2=$8, color3=$9, color4=$10, random_color=$5, show_seconds=$6, rotate=$7, use_gradient=$11 WHERE name=$2 AND device_id=$1"
        let r = await db.query(q, [
            this.#deviceId,
            this.#name,
            Number.parseInt(this.#speed),
            this.#color,
            this.#randomColor,
            this.#showSeconds,
            this.#rotate,
            this.#color2,
            this.#color3,
            this.#color4,
            this.#useGradient
        ])
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
            const s = new DeviceModeSettings(row.name, row.device_id)
            s.#speed = row.speed
            s.#color = row.color
            s.#color2 = row.color2
            s.#color3 = row.color3
            s.#color4 = row.color4
            s.#randomColor = row.random_color
            s.#showSeconds = row.show_seconds
            s.#rotate = row.rotate
            s.#useGradient = row.use_gradient
            settings.push(s)
        }
        return settings
    }

}

module.exports = {
    validModes,
    DeviceModeSettings
}
