import express from "express"
import { generateConfigFileRoute } from "./src/generateConfigFile.server.js"

export const openaiService = express.Router()

openaiService.use(generateConfigFileRoute)
