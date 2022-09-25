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
        if (configs.includes("color")) {
            if (settings) document.getElementById("currentColor").value = settings.color
            document.getElementById("currentColor").style.visibility = "visible"
        } else {
            document.getElementById("currentColor").style.visibility = "hidden"
        }
        if (configs.includes("showSeconds")) {
            if (settings && settings.showSeconds) document.getElementById("showSeconds").checked = true
            else document.getElementById("showSeconds").checked = false
            document.getElementById("showSecondsGroup").style.visibility = "visible"
        } else {
            document.getElementById("showSecondsGroup").style.visibility = "hidden"
        }
        if (configs.includes("speed")) {
            if (settings) document.getElementById("effectSpeed").value = settings.speed
            document.getElementById("effectSpeedGroup").style.visibility = "visible"
        } else {
            document.getElementById("effectSpeedGroup").style.visibility = "hidden"
        }
        if (configs.includes("randomColor")) {
            if (settings && settings.randomColor) document.getElementById("randomColor").checked = true
            else document.getElementById("randomColor").checked = false
            document.getElementById("randomColorGroup").style.visibility = "visible"
        } else {
            document.getElementById("randomColorGroup").style.visibility = "hidden"
        }
        if (configs.includes("rotate")) {
            if (settings && settings.rotate) document.getElementById("rotate").checked = true
            else document.getElementById("rotate").checked = false
            document.getElementById("rotateGroup").style.visibility = "visible"
        } else {
            document.getElementById("rotateGroup").style.visibility = "hidden"
        }
    } else {
        document.getElementById("currentColor").style.visibility = "hidden"
        document.getElementById("effectSpeedGroup").style.visibility = "hidden"
        document.getElementById("showSecondsGroup").style.visibility = "hidden"
        document.getElementById("randomColorGroup").style.visibility = "hidden"
        document.getElementById("rotateGroup").style.visibility = "hidden"
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
        color: document.getElementById("currentColor").value,
        mode: document.getElementById("currentModeSelector").value,
        on: isOn(),
        brightness: document.getElementById("cbrightness").value,
        speed: document.getElementById("effectSpeed").value,
        randomColor: document.getElementById("randomColor").checked,
        showSeconds: document.getElementById("showSeconds").checked,
        rotate: document.getElementById("rotate").checked
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
