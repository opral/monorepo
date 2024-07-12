import * as Comlink from "comlink"

import { asyncIterableTransferHandler } from "./transfer-handlers/asyncIterable.js"
import { watchOptionsTransferHandler } from "./transfer-handlers/watchOptions.js"
import { nodeishStatsTransferHandler } from "./transfer-handlers/nodeishStats.js"

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("watchOptions", watchOptionsTransferHandler)
Comlink.transferHandlers.set("NodeishStats", nodeishStatsTransferHandler)
