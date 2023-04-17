import { publicEnv } from "@inlang/env-variables"
import { rpcClient } from "typed-rpc"

// ! Only import the type to not leak the implementation to the client
import type { AllRpcs } from "./functions/index.js"
import type { generateConfigFileClient } from "./functions/generateConfigFile.client.js"

// must be identical to path in route.ts
export const route = "/_rpc"

/**
 * RPC functions with client side patches.
 *
 * Client side patches are required to execute code before the server side code.
 * Some RPC functions require this, for example the `generateConfigFile` function.
 */
type RpcsWithClientSidePatches = Omit<AllRpcs, "generateConfigFileServer"> & {
	generateConfigFile: typeof generateConfigFileClient
}

/**
 * The RPC client.
 *
 * This is used by the client to call RPC functions.
 *
 * @example
 *   const [value, exception] = await rpc.generateConfigFile({ fs, path: "./" })
 */
export const rpc = new Proxy(
	rpcClient<RpcsWithClientSidePatches>(publicEnv.PUBLIC_SERVER_BASE_URL + route),
	{
		// patching client side routes
		get(target, prop) {
			if (prop === "generateConfigFile") {
				return async (...args: Parameters<typeof generateConfigFileClient>) => {
					const { generateConfigFileClient } = await import(
						"./functions/generateConfigFile.client.js"
					)
					return generateConfigFileClient(...args)
				}
			}
			return (target as any)[prop]
		},
	},
)
