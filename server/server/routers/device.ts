import express, {Response} from "express"
import auth from "../middleware/auth"
import { Device } from "../models/device"
import { modes } from "../models/device_mode"
import logger from "../logger"

const router = express.Router()

router.get("/", auth, async (req: any, res: Response): Promise<any> => {
    let device: Device | undefined
    let err: string = ""
    // ID is given, search for device
    if (req.query.id) {
        try {
            device = await Device.FindByID(Number.parseInt(req.query.id.toString()))
        } catch (e: any) { err = e.message }
    }
    return res.render("device_form", {
        settings: req.session.settings,
        title: "Create Device",
        device,
        modes,
        err
    })
})

router.post("/", auth, async (req: any, res: Response): Promise<any> => {
    let device: Device = new Device("", "")
    let save: boolean = false
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
                modes,
                err
            })
        }
    }
    device.name = req.body.name
    device.ip = req.body.ip
    device.setToken(req.body.token)
    device.active = req.body.active

    try {
        if (save) await device.write()
        else await device.create()
    } catch (err) {
        return res.render("device_form", {
            settings: req.session.settings,
            title: "Edit Device",
            device,
            modes,
            err
        })
    }

    return res.redirect("/")
})

router.get("/delete", auth, async (req: any, res: Response): Promise<any> => {
    try {
        if (!req.query.id)
            throw new Error("Please specify an ID.")

        // TODO: Could be enhanced by writing static Delete function which executes only 1 query
        const d = await Device.FindByID(Number.parseInt(req.query.id.toString()))
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

export default router
