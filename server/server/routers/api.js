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

router.post("/updateMode", auth, async (req, res) => {    
    let device = undefined
    try {
        device = await Device.FindByID(req.body.id)
    } catch (e) {
        logger.info(e)
        return res.status(404).send({error: `Device with id ${req.body.id} cannot be founbd.`})
    }
    let color = undefined
    if (req.body.color) color = req.body.color
    try {
        await device.updateMode(req.body.mode, req.body.color)
    } catch (e) {
        console.log(e)
        return res.status(400).send({error: e})
    }

    return res.send({success: `Mode was successfully updated to ${req.body.mode}.`})
})

router.get("/currentTime", async (req, res) => {
    // NOTE: If timezones per clock are activated we'll need device "authentication"
    res.send({
        timestamp: Date.now(),
    })
})

router.post("/config", async (req, res) => {
    let device = undefined
    logger.info(`Body: ${JSON.stringify(req.body)}`)
    try {
        device = await getDeviceByToken(res, req.body.token)
    } catch (e) {
        return;
    }

    return res.send({
        timestamp: Date.now(),
        mode: device.getMode(),
        color: device.getColor()
    })
})

router.post("/currentMode", async (req, res) => {
    let device = undefined
    try {
        device = await getDeviceByToken(req.body.token)
    } catch(e) {
        return;
    }

    const r = {
        mode: device.getMode(),
        color: device.getColor()
    }
    return res.send(r)
})

module.exports = router
