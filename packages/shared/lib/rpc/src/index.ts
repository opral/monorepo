import { machineTranslate } from "./machineTranslate.js"

export const rpcs = {
	machineTranslate,
}

export type RpcService = typeof rpcs
