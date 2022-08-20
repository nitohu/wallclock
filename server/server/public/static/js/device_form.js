document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generateToken").onclick = generateToken
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

