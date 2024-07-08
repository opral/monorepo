import { endpoint } from "comlink-node/worker"
import { makeLinterAvailableTo } from "./linter.js"

makeLinterAvailableTo(endpoint)
