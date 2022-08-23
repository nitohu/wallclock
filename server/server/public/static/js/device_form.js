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
    console.log(sel)
    if (sel.classList.contains("configurable")) {
        document.getElementById("currentColor").style.visibility = "visible"
    } else {
        document.getElementById("currentColor").style.visibility = "hidden"
    }
}

function updateCurrentMode() {
    const id = parameterList = new URLSearchParams(window.location.search).get("id")
    const req = new XMLHttpRequest()
    const body = {
        id,
        color: document.getElementById("currentColor").value,
        mode: document.getElementById("currentModeSelector").value
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
                f.parentNode.insertBefore(el, f)
            } else {
                const f = document.getElementsByTagName("form")[0]
                const el = document.createElement("div")
                el.classList = "alert alert-warning"
                el.innerHTML = res.error
                f.parentNode.insertBefore(el, f)
            }
        }
    }

    req.open("POST", "/api/updateMode")
    req.setRequestHeader("Content-Type", "application/json")
    req.send(JSON.stringify(body))
}