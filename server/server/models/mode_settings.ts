import db from "../db"
import { validModes } from "./device_mode"

const INVALID_HEX_CODE_ERR = "Please enter a valid hex (must be 6 characters long with a leading #)."

/**
 * DeviceModeSettings stores settings for specific modes for each devices in the database
 */
class DeviceModeSettings {
    #deviceId: number
    #name: string
    #speed = 10
    #color: string
    #color2: string
    #color3: string
    #color4: string
    #randomColor = false
    #showSeconds = true
    #rotate = true
    #useGradient = false

    constructor(name: string, deviceID: number) {
        if (!validModes.includes(name))
            throw new Error("Invalid name.")
        this.#name = name
        this.#deviceId = deviceID
        this.#color = ""
        this.#color2 = ""
        this.#color3 = ""
        this.#color4 = ""
    }

    #testColor(color: string): boolean {
        const regex = new RegExp("^#[0-9a-fA-F]{6}$")
        if (!regex.test(color))
            return false
        return true
    }

    getName(): string { return this.#name }
    getSpeed(): number {
        return this.#speed
    }
    getColor(): string { return this.#color }
    getColor2(): string { return this.#color2 }
    getColor3(): string { return this.#color3 }
    getColor4(): string { return this.#color4 }
    getRandomColor(): boolean { return this.#randomColor }
    getShowSeconds(): boolean { return this.#showSeconds }
    getRotate(): boolean { return this.#rotate }
    getUseGradient(): boolean { return this.#useGradient }
    setSpeed(speed: number | undefined) {
        if (speed === undefined) return
        if (speed > 50) this.#speed = 50
        else if (speed < 0) this.#speed = 0
        else this.#speed = speed
    }
    setColor(color: string | undefined) {
        if (color === undefined) return
        if (!this.#testColor(color))
            throw new Error(INVALID_HEX_CODE_ERR)
        this.#color = color
    }
    setColor2(color: string | undefined) {
        if (color === undefined) return
        if (!this.#testColor(color))
            throw new Error(INVALID_HEX_CODE_ERR)
        this.#color2 = color
    }
    setColor3(color: string | undefined) {
        if (color === undefined) return
        if (!this.#testColor(color))
            throw new Error(INVALID_HEX_CODE_ERR)
        this.#color3 = color
    }
    setColor4(color: string | undefined) {
        if (color === undefined) return
        if (!this.#testColor(color))
            throw new Error(INVALID_HEX_CODE_ERR)
        this.#color4 = color
    }
    setRandomColor(rc: boolean | undefined) {
        if (rc === undefined) return
        this.#randomColor = rc
    }
    setShowSeconds(show: boolean | undefined) {
        if (show === undefined) return
        this.#showSeconds = show
    }
    setRotate(rotate: boolean | undefined) {
        if (rotate === undefined) return
        this.#rotate = rotate
    }
    setUseGradient(ug: boolean | undefined) {
        if (ug === undefined) return
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
            this.#speed,
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
        
        // r = r.rows[0]
    }
    // Write to database
    async write() {
        if (this.#deviceId === undefined)
            throw new Error("Device ID is undefined.")
        if (this.#deviceId <= 0)
            throw new Error("Device ID must be greater than 0.")
        if (!validModes.includes(this.#name))
            throw new Error("Invalid name.")
        
        const q = "UPDATE mode_settings SET speed=$3, color=$4, color2=$8, color3=$9, color4=$10, random_color=$5, show_seconds=$6, rotate=$7, use_gradient=$11 WHERE name=$2 AND device_id=$1"
        let r = await db.query(q, [
            this.#deviceId,
            this.#name,
            this.#speed,
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
    async delete(): Promise<number> {
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

    static async GetSettings(device_id: number): Promise<DeviceModeSettings[]> {
        if (device_id <= 0)
            throw new Error("Device ID must be greater than 0")
        
        const q = "SELECT * FROM mode_settings WHERE device_id=$1"
        let res = await db.query(q, [device_id])
        if (!res)
            throw new Error("Something bad happened")
        
        let settings: DeviceModeSettings[] = []
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

export {
    validModes,
    DeviceModeSettings
}
