import express from "express"
import { router } from "./router.js"

const app = express()

app.use("*", router)

const port = 4001
app.listen(port, () => console.info(`Server listening at http://localhost:${port}`))
