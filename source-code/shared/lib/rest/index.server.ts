import express from "express"
import { getTranslateRoute } from "./src/getTranslation.server.js"

export const restService = express.Router()

restService.use(getTranslateRoute)
