const express = require("express")
const auth = require("../middleware/auth")
const Device = require("../models/device")
const logger = require("../logger")

const router = express.Router()

router.use(express.json())

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

router.get("/currentMode", async (req, res) => {
    let device = undefined
    try {
        device = await Device.FindByToken(req.body.token)
    } catch (e) {
        return res.status(404).send({error: `Device with token ${req.body.token} not found.`})
    }

    if (!device.active) return res.status(403).send({error: "Device is not active."})

    device.updateLastConn()
    try {
        await device.write()
    } catch (e) {
        logger.warn(`Error while writing device ${device.name} to database: ${e}`)
    }

    const r = {
        mode: device.getMode(),
        color: device.getColor()
    }
    return res.send(r)
})

module.exports = router
