import { rpcClient } from "typed-rpc";
// ! Only import the type to not leak the implementation to the client
import type { AllRpcs } from "./functions/index.js";
import { PUBLIC_ENV_VARIABLES } from "./services/env-variables/index.js";

// must be identical to path in route.ts
export const route = "/_rpc";

/**
 * The RPC client.
 *
 * This is used by the client to call RPC functions.
 *
 * @example
 *   const [value, exception] = await rpc.generateConfigFile({ fs, path: "./" })
 */
export const rpc = rpcClient<AllRpcs>(
	PUBLIC_ENV_VARIABLES.PUBLIC_SERVER_BASE_URL + route
);
