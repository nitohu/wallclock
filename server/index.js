const express = require("express")

const app = express()

app.get("/", async (req, res) => {
    res.send("<h1>Hello World!</h1>")
})

app.listen(8000, null)
