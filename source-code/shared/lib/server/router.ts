import express from "express"
import { openaiService } from "../openai/index.server.js"
import bodyParser from "body-parser"

/**
 * Entry point for all services that require a server.
 *
 * @example
 *   const app = express()
 *   app.use(inlangServices)
 */
export const router = express.Router()

router.use(openaiService)
