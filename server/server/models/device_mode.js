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
    "color2",
    "color3",
    "color4",
    "speed",
    "randomColor",
    "showSeconds",
    "rotate",
    "useGradient"
]

/**
 * DeviceMode holds general information (independent from database records) in memory
 */
class DeviceMode {
    // Fields
    name = ""
    displayName = ""
    isConfigurable = false
    configs = []

    constructor(name, displayName, isConfigurable, configs) {
        this.name = name
        this.displayName = displayName
        this.isConfigurable = isConfigurable
        if (!this.isConfigurable) return;
        // only add valid configurations
        for (let i = 0; i < configs.length; i++) {
            if (mode_config.includes(configs[i])) this.configs.push(configs[i])
        }
    }
}

const modes = [
    new DeviceMode("sclock", "Simple Clock", true, ["showSeconds", "color", "color2", "color3"]),
    new DeviceMode("gclock", "Gradient Clock", true, ["color", "color2", "color3", "color4", "useGradient"]),
    new DeviceMode("rainbow", "Color Rainbow", true, ["speed", "rotate"]),
    new DeviceMode("static", "Static Color", true, ["color"]),
    new DeviceMode("pulse", "Pulse", true, ["speed", "color", "randomColor"]),
    new DeviceMode("fade", "Fade", true, ["speed"])
]

module.exports = {
    validModes,
    modes,
    // TODO: Can probably be removed
    mode_config,
    DeviceMode
}
