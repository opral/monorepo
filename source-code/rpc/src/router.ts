import express from "express"
import bodyParser from "body-parser"
import { rpcHandler } from "typed-rpc/lib/express.js"
import { rpcs } from "./rpcs.js"
import { route } from "./client.js"
import { initTelemetryNode } from "@inlang/telemetry"

export const router = express.Router()

// just in case init telemetry
initTelemetryNode()

// some rpcs can be quite large
router.use(bodyParser.json({ limit: "50mb" }))

router.use(route, rpcHandler(rpcs))
