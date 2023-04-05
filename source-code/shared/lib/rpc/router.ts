import { rpcHandler } from "typed-rpc/lib/express.js"
import express from "express"
import { rpcs } from "./src/index.js"

export const rpcService = express.Router()

rpcService.use("/shared/rpc", rpcHandler(rpcs))
