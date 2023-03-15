import { middleware as apiService } from "../lib/rpc/index.server.js"
import express from "express"

const app = express()

app.use(apiService)
