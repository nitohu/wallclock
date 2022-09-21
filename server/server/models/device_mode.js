const validModes = [
    "gclock",
    "sclock",
    "rainbow",
    "static",
    "pulse",
    "fade",
    "white"
]

const mode_config = [
    "color",
    "speed",
    "rotate"
]

/**
 * DeviceMode holds general information (independent from database records) in memory
 */
class DeviceMode {
    // Fields
    name = ""
    displayName = ""
    isConfigurable = false

    constructor(name, displayName, isConfigurable) {
        this.name = name
        this.displayName = displayName
        this.isConfigurable = isConfigurable
    }
}

const modes = [
   new DeviceMode("sclock", "Simple Clock", false),
   new DeviceMode("gclock", "Gradient Clock", false),
   new DeviceMode("rainbow", "Color Rainbow", true),
   new DeviceMode("static", "Static Color", true),
   new DeviceMode("pulse", "Pulse", true),
   new DeviceMode("fade", "Fade", true)
]

module.exports = {
    validModes,
    modes,
    // Can probably be removed
    mode_config,
    DeviceMode
}
