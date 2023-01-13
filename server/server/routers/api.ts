import express, {Request, Response} from "express"
import auth from "../middleware/auth"
import { Device, DeviceSettings } from "../models/device"
import logger from "../logger"
import { DeviceModeSettings } from "../models/mode_settings"

const router = express.Router()

router.use(express.json())

const buildSettings = (body: any): DeviceSettings => {
    if (!("mode" in body)) {
        throw new Error("'mode' must be included inside the request body.")
    }
    let settings: DeviceSettings = {
        mode: body.mode
    }
    if ("color" in body) {
        settings.color = body.color
    }
    if ("color2" in body) {
        settings.color2 = body.color2
    }
    if ("color3" in body) {
        settings.color3 = body.color3
    }
    if ("color4" in body) {
        settings.color4 = body.color4
    }
    if ("isOn" in body) {
        settings.isOn = body.on
    }
    if ("brightness" in body) {
        settings.brightness = body.brightness
    }
    if ("speed" in body) {
        settings.delay = body.speed
    }
    if ("randomColor" in body) {
        settings.randomColor = body.randomColor
    }
    if ("showSeconds" in body) {
        settings.showSeconds = body.showSeconds
    }
    if ("rotate" in body) {
        settings.rotate = body.rotate
    }
    if ("useGradient" in body) {
        settings.useGradient = body.useGradient
    }
    return settings
}

const getDeviceByToken = async (res: Response, token: string): Promise<Device> => {
    let device: Device
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

router.get("/generateDeviceToken", auth, async (req: Request, res: Response): Promise<any> => {
    if (!req.query.id) return res.status(400).send({error: "Please provide a device id."})
    let device: Device

    try {
        device = await Device.FindByID(Number.parseInt(req.query.id.toString()))
    } catch(e) {
        return res.status(404).send({error: `Device with id ${req.query.id} cannot be found.`})
    }
    const token = device.generateToken()
    res.send({token: token})
})

// Can be used by clients / form to update the current configuration of device
router.post("/updateMode", auth, async (req: Request, res: Response): Promise<any> => {
    let device: Device
    // Find device
    try {
        device = await Device.FindByID(req.body.id)
    } catch (e) {
        logger.info(e)
        return res.status(404).send({error: `Device with id ${req.body.id} cannot be found.`})
    }
    // Save to database
    let settings = buildSettings(req.body)
    try {
        await device.updateMode(settings)
    } catch (e) {
        console.log(e)
        return res.status(400).send({error: e})
    }
    // Update actual device
    device.push()

    return res.send({success: `Mode was successfully updated to ${req.body.mode}.`})
})

router.get("/getModeSettings", auth, async (req: Request, res: Response): Promise<any> => {
    let settings: DeviceModeSettings[]
    try {
        if (!req.query.device_id)
            throw new Error("Please specify a device_id.")
        settings = await DeviceModeSettings.GetSettings(Number.parseInt(req.query.device_id.toString()))
    } catch (e) {
        logger.warn(e)
        return res.status(400).send({error: e})
    }
    const data: object[] = []
    for (let i = 0; i < settings.length; i++) {
        const d = {
            name: settings[i].getName(),
            speed: settings[i].getSpeed(),
            color: settings[i].getColor(),
            color2: settings[i].getColor2(),
            color3: settings[i].getColor3(),
            color4: settings[i].getColor4(),
            randomColor: settings[i].getRandomColor(),
            showSeconds: settings[i].getShowSeconds(),
            rotate: settings[i].getRotate(),
            useGradient: settings[i].getUseGradient()
        }
        data.push(d)
    }
    res.send(data)
})

router.get("/currentTime", async (req: Request, res: Response): Promise<any> => {
    // NOTE: If timezones per clock are activated we'll need device "authentication"
    res.send({
        timestamp: Date.now(),
    })
})

// Used by the arduino to get initial configuration
router.post("/config", async (req: Request, res: Response): Promise<any> => {
    let device: Device
    logger.info(`Body: ${JSON.stringify(req.body)}`)
    try {
        device = await getDeviceByToken(res, req.body.token)
    } catch (e) {
        return;
    }

    logger.info(`Device ${device.name} asks for configuration`)
    let deviceSettings: DeviceModeSettings | undefined
    if (device.mode.isConfigurable) {
        deviceSettings = device.getCurrentModeSettings()
    }
    let body: any = {
        // Return timestamp as seconds
        timestamp: Date.now()/1000,
        mode: device.mode.name,
        brightness: device.getBrightness(),
        on: device.isOn()
    }
    if (deviceSettings !== undefined) {
        if (device.mode.configs.includes("color")) {
            body.color = deviceSettings.getColor()
        }
        if (device.mode.configs.includes("color2")) {
            body.color2 = deviceSettings.getColor2()
        }
        if (device.mode.configs.includes("color3")) {
            body.color3 = deviceSettings.getColor3()
        }
        if (device.mode.configs.includes("color4")) {
            body.color4 = deviceSettings.getColor4()
        }
        if (device.mode.configs.includes("randomColor")) {
            body.randomColor = deviceSettings.getRandomColor()
        }
        if (device.mode.configs.includes("showSeconds")) {
            body.showSeconds = deviceSettings.getShowSeconds()
        }
        if (device.mode.configs.includes("speed")) {
            body.delay = deviceSettings.getSpeed()
        }
        if (device.mode.configs.includes("rotate")) {
            body.rotate = deviceSettings.getRotate()
        }
        if (device.mode.configs.includes("useGradient")) {
            body.useGradient = deviceSettings.getUseGradient()
        }
    }
    return res.send(body)
})

export default router
