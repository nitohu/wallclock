const express = require("express")
const auth = require("../middleware/auth")
const Device = require("../models/device")
const logger = require("../logger")

const router = express.Router()

router.use(express.json())

const getDeviceByToken = async (res, token) => {
    let device = undefined
    try {
        device = await Device.FindByToken(token)
    } catch (e) {
        res.status(404).send({error: `Device with token ${token} not found.`})
        throw e;
    }

    if (!device.active){
        res.status(403).send({error: "Device is not active."})
        throw new Error();
    }

    device.updateLastConn()
    try {
        await device.write()
    } catch (e) {
        logger.warn(`Error while writing device ${device.name} to database: ${e}`)
        throw e
    }

    return device
}

router.get("/generateDeviceToken", auth, async (req, res) => {
    if (!req.query.id) return res.status(400).send({error: "Please provide a device id."})
    let device = undefined
    try {
        device = await Device.FindByID(req.query.id)
    } catch(e) {
        return res.status(404).send({error: `Device with id ${req.query.id} cannot be found.`})
    }
    const token = device.generateToken()
    res.send({token: token})
})

// Can be used by clients / form to update the current configuration of device
router.post("/updateMode", auth, async (req, res) => {    
    let device = undefined
    // Find device
    try {
        device = await Device.FindByID(req.body.id)
    } catch (e) {
        logger.info(e)
        return res.status(404).send({error: `Device with id ${req.body.id} cannot be founbd.`})
    }
    // TODO: Probably need to check if values are actually included in request body (& maybe validate them as well)
    // Save to database
    try {
        await device.updateMode(req.body.mode, req.body.color, req.body.on, req.body.brightness, req.body.speed)
    } catch (e) {
        console.log(e)
        return res.status(400).send({error: e})
    }
    // Update actual device
    device.push()

    return res.send({success: `Mode was successfully updated to ${req.body.mode}.`})
})

router.get("/currentTime", async (req, res) => {
    // NOTE: If timezones per clock are activated we'll need device "authentication"
    res.send({
        timestamp: Date.now(),
    })
})

// Used by the arduino to get initial configuration
router.post("/config", async (req, res) => {
    let device = undefined
    logger.info(`Body: ${JSON.stringify(req.body)}`)
    try {
        device = await getDeviceByToken(res, req.body.token)
    } catch (e) {
        return;
    }

    logger.info(`Device ${device.name} asks for configuration`)
    let deviceSettings = undefined
    if (device.mode.isConfigurable) {
        deviceSettings = device.getCurrentModeSettings()
    }
    return res.send({
        // Return timestamp as seconds
        timestamp: Date.now()/1000,
        mode: device.mode.name,
        brightness: device.getBrightness(),
        on: device.isOn(),
        color: deviceSettings ? deviceSettings.getColor() : "#00ff00",
        delay: deviceSettings ? deviceSettings.getSpeed() : 100
    })
})

module.exports = router
