let mode_settings = [];

// Get settings for each mode of current device
(function () {
    fetchCurrentModeSettings()
})()

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generateToken").onclick = generateToken

    document.getElementById("currentModeSelector").onchange = getCurrentMode
    document.getElementById("updateMode").onclick = updateCurrentMode
})

function generateToken() {
    let req = new XMLHttpRequest()

    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            const res = JSON.parse(this.responseText)
            console.log(res)
            if (this.status == 200) {
                document.getElementById("token").value = res.token
            } else {
                const f = document.getElementsByTagName("form")[0]
                const el = document.createElement("div")
                el.classList = "alert alert-warning"
                el.innerHTML = res.error
                f.parentNode.insertBefore(el, f)
            }
        }
    }

    let id = parameterList = new URLSearchParams(window.location.search).get("id")
    req.open("GET", `/api/generateDeviceToken?id=${id}`, true)
    req.send()
}

function updateBoolConfigField(configs, settings, curr_conf, cssClass) {
    if (configs.includes(curr_conf)) {
        if (settings && settings[curr_conf]) document.getElementById(curr_conf).checked = true
        else document.getElementById(curr_conf).checked = false

        document.getElementById(cssClass).style.display = "block"
    } else {
        document.getElementById(cssClass).style.display = "none"
    }
}

function updateTextConfigField(configs, settings, curr_conf, val, cssClass) {
    if (configs.includes(curr_conf)) {
        if (settings) document.getElementById(curr_conf).value = val

        document.getElementById(cssClass).style.display = "block"
    } else {
        document.getElementById(cssClass).style.display = "none"
    }
}

function getCurrentMode() {
    const self = document.getElementById("currentModeSelector") 
    const sel = self.options[self.selectedIndex]
    if (sel.className.includes("configurable")) {
        let configs = [];
        sel.classList.forEach((e) => configs.push(e.split("-")[1]))
        let settings = undefined
        mode_settings.forEach((s) => {
            if (s.name == sel.value) settings = s
        })
        
        // TODO: add more configurations
        updateTextConfigField(configs, settings, "color", settings.color, "colorGroup")
        updateTextConfigField(configs, settings, "color2", settings.color2, "color2Group")
        updateTextConfigField(configs, settings, "color3", settings.color3, "color3Group")
        updateTextConfigField(configs, settings, "color4", settings.color4, "color4Group")
        updateBoolConfigField(configs, settings, "showSeconds", "showSecondsGroup")
        updateTextConfigField(configs, settings, "speed", settings.color, "effectSpeedGroup")
        updateBoolConfigField(configs, settings, "randomColor", "randomColorGroup")
        updateBoolConfigField(configs, settings, "rotate", "rotateGroup")
        updateBoolConfigField(configs, settings, "useGradient", "useGradientGroup")
    } else {
        document.getElementById("currentColor").style.display = "hidden"
        document.getElementById("effectSpeedGroup").style.display = "hidden"
        document.getElementById("showSecondsGroup").style.display = "hidden"
        document.getElementById("randomColorGroup").style.display = "hidden"
        document.getElementById("rotateGroup").style.display = "hidden"
    }
}

function fetchCurrentModeSettings() {
    const id = new URLSearchParams(window.location.search).get("id")
    const req = new XMLHttpRequest()

    req.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            mode_settings = JSON.parse(this.responseText)
            console.log("Settings successfully fetched...")
            console.log(mode_settings)
        } else if (this.readyState === 4) {
            console.warn(JSON.parse(this.responseText))
        }
    }

    req.open("GET", `/api/getModeSettings?device_id=${id}`)
    req.setRequestHeader("Content-Type", "application/json")
    req.send()
}

function isOn() {
    const inp = document.getElementsByName("is_on")
    for (let i = 0; i < inp.length; i++) {
        const el = inp[i]
        if (el.value == "on" && el.checked) return true;
    }
    return false;
}

function updateCurrentMode() {
    const id = parameterList = new URLSearchParams(window.location.search).get("id")
    const req = new XMLHttpRequest()
    const body = {
        id,
        color: document.getElementById("color").value,
        color2: document.getElementById("color2").value,
        color3: document.getElementById("color3").value,
        color4: document.getElementById("color4").value,
        mode: document.getElementById("currentModeSelector").value,
        on: isOn(),
        brightness: document.getElementById("cbrightness").value,
        speed: document.getElementById("speed").value,
        randomColor: document.getElementById("randomColor").checked,
        showSeconds: document.getElementById("showSeconds").checked,
        rotate: document.getElementById("rotate").checked,
        useGradient: document.getElementById("useGradient").checked
    }

    req.onreadystatechange = function() {
        if (this.readyState === 4) {
            const res = JSON.parse(this.responseText)
            console.log(res)
            if (this.status === 200) {
                const f = document.getElementsByTagName("form")[0]
                const el = document.createElement("div")
                el.classList = "alert alert-success"
                el.innerHTML = res.success
                const btn = document.createElement("button")
                btn.classList = "btn-close"
                btn.setAttribute("data-bs-dismiss", "alert")
                el.appendChild(btn)
                f.parentNode.insertBefore(el, f)
            } else {
                const f = document.getElementsByTagName("form")[0]
                const el = document.createElement("div")
                el.classList = "alert alert-warning"
                el.innerHTML = res.error
                const btn = document.createElement("button")
                btn.classList = "btn-close"
                btn.setAttribute("data-bs-dismiss", "alert")
                el.appendChild(btn)
                f.parentNode.insertBefore(el, f)
            }
        }
    }

    req.open("POST", "/api/updateMode")
    req.setRequestHeader("Content-Type", "application/json")
    req.send(JSON.stringify(body))

    fetchCurrentModeSettings()
}
