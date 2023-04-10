import { machineTranslate } from "./functions/machineTranslate.js"

export const rpcs = {
	machineTranslate,
}

export type RpcService = typeof rpcs
