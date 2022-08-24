class DeviceMode {
    // Fields
    name = ""
    displayName = ""
    isConfigurable = false
    // Configurable fields
    #speed = 1 // for rotations / animations
    #r = 255   // for static colors
    #g = 255
    #b = 255

    constructor(name, displayName, isConfigurable, speed, r, g, b) {
        this.name = name
        this.displayName = displayName
        this.isConfigurable = isConfigurable
        if (this.isConfigurable) this.#speed = speed
        if (this.isConfigurable) this.#r = r
        if (this.isConfigurable) this.#g = g
        if (this.isConfigurable) this.#b = b
    }

    // Getter Methods
    getSpeed() { return this.#speed }
    getRed() { return this.#r }
    getGreen() { return this.#g }
    getBlue() { return this.#b }
    getRGB() { return [this.#r, this.#g, this.#b] }

    // Setter Methods
    setSpeed(s) {
        if (s < 0 || s > 100) throw new Error("Value of speed must be between 0 and 100")
        if (!this.isConfigurable) throw new Error("Device mode currently not configurable")
        this.#speed = s
    }
    setR(r) {
        if (r < 0 || r > 255) throw new Error("Value of red must be between 0 and 255")
        if (!this.isConfigurable) throw new Error("Device mode currently not configurable")
        this.#r = r
    }
    setG(g) {
        if (g < 0 || g > 255) throw new Error("Value of green must be between 0 and 255")
        if (!this.isConfigurable) throw new Error("Device mode currently not configurable")
        this.#g = g
    }
    setB(b) {
        if (b < 0 || b > 255) throw new Error("Value of blue must be between 0 and 255")
        if (!this.isConfigurable) throw new Error("Device mode currently not configurable")
        this.#b = b
    }
}

const modes = [
    // RGB might be configurable in future
    new DeviceMode("sclock", "Simple Clock", false),
    new DeviceMode("gclock", "Gradient Clock", false),
    // Speed is configurable
    new DeviceMode("rainbow", "Color Rainbow", true, 50),
    // Color is configurable
    new DeviceMode("static", "Static Color", true, -1, 0, 255, 0),
    // Speed & Color is configurable
    new DeviceMode("pulse", "Pulse", true, 20, 255, 0, 0),
    // Speed is configurable
    new DeviceMode("fade", "Fade", true, 50, 0, 0, 0)
]

module.exports = {
    model: DeviceMode,
    modes
}
