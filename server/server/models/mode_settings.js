const db = require("../db")
const { validModes } = require("./device_mode")

/**
 * DeviceModeSettings stores settings for specific modes for each devices in the database
 */
class DeviceModeSettings {
    #deviceId = 0
    #name = ""
    #speed = 100
    #color = ""
    #randomColor = false
    #showSeconds = true

    constructor(name, deviceID) {
        if (!validModes.includes(name))
            throw new Error("Invalid name.")
        this.#name = name
        this.#deviceId = deviceID
    }

    getName() { return this.#name }
    getSpeed() { return this.#speed }
    getColor() { return this.#color }

    setSpeed(speed) {
        this.#speed = speed
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

    // Create database record
    async create() {
        if (this.#deviceId <= 0 ||
            !validModes.includes(this.#name))
            throw new Error("Device ID or name invalid.")

        const q = "INSERT INTO mode_settings(device_id, name, speed, color, random_color, show_seconds) VALUES ($1, $2, $3, $4, $5, $6)"
        let r = await db.query(q, [this.#deviceId, this.#name, this.#speed, this.#color, this.#randomColor, this.#showSeconds])
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
        
        const q = "UPDATE device SET speed=$3, color=$4, random_color=$5, show_seconds=$6 WHERE name=$2 AND device_id=$1"
        let r = await db.query(q, [this.#deviceId, this.#name, this.#color, this.#randomColor, this.#showSeconds])
        if (!r)
            throw new Error("Something bad happened.")
        if (r.rowCount === 0)
            throw new Error("No row was affected.")
        
    }

    // Delete from database
    async delete() {
        if (this.#deviceId <= 0)
            throw new Error("Device ID must be greater than 0.")
        const q = "DELETE FROM device WHERE device_id=$1 AND name=$2"
        let r = await db.query(q, [this.#deviceId, this.#name])
        if (!r)
            throw new Error("An unexpected error occured")
        if (r.rowCount == 0)
            throw new Error("No row was affected.")
        
        return r.rows[0]
    }

}

module.exports = {
    validModes,
    DeviceModeSettings
}
