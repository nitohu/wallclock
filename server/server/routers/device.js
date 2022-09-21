const express = require("express")
const auth = require("../middleware/auth")
const Device = require("../models/device")
const { DeviceMode, modes } = require("../models/device_mode")
const logger = require("../logger")

const router = express.Router()

router.get("/", auth, async (req, res) => {
    let device = undefined
    let err = undefined
    // ID is given, search for device
    if (req.query.id) {
        try {
            device = await Device.FindByID(req.query.id)
        } catch (e) { err = e }
    }
    return res.render("device_form", {
        settings: req.session.settings,
        title: "Create Device",
        device,
        modes,
        err
    })
})

router.post("/", auth, async (req, res) => {
    let device = new Device()
    let save = false
    // Get device to be edited, return back to form if not found
    if (req.body.id && req.body.submit == "Save") {
        try {
            await device.findByID(req.body.id)
            save = true
        } catch (err) {
            return res.render("device_form", {
                settings: req.session.settings,
                title: "Edit Device",
                device,
                err
            })
        }
    }
    device.name = req.body.name
    device.ip = req.body.ip
    device.token = req.body.token
    logger.info(`Body active: ${req.body.active}`)
    device.active = req.body.active

    try {
    if (save) await device.write()
    else await device.create()
    } catch (err) {
        return res.render("device_form", {
            settings: req.session.settings,
            title: "Edit Device",
            device,
            err
        })
    }

    return res.redirect("/")
})

router.get("/delete", auth, async (req, res) => {
    try {
        // TODO: Could be enhanced by writing static Delete function which executes only 1 query
        const d = await Device.FindByID(req.query.id)
        const r = await d.delete()
        logger.info(`Successfully deleted device "${r.name}" with ID ${r.id}`)
        
        return res.redirect("/")
    } catch (err) {
        return res.render("delete_device_err", {
            settings: req.session.settings,
            // err: "Please enter an ID to delete a device."
            err
        })
    }
})

module.exports = router
