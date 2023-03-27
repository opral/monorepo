import express from "express"
import { openaiService } from "../lib/openai/index.server.js"

/**
 * Entry point for all services that require a server.
 *
 * @example
 *   const app = express()
 *   app.use(inlangServices)
 */
export const inlangServices = express.Router()

inlangServices.use(openaiService)
