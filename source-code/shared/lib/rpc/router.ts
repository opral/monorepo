import express from "express"
import bodyParser from "body-parser"
import { rpcHandler } from "typed-rpc/lib/express.js"
import { rpcs } from "./src/rpcs.js"

export const rpcService = express.Router()
// some rpcs can be quite large
rpcService.use(bodyParser.json({ limit: "50mb" }))

rpcService.use("/shared/rpc", rpcHandler(rpcs))
