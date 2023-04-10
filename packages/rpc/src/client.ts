import { publicEnv } from "@inlang/env-variables"
import { rpcClient } from "typed-rpc"

// ! Only import the type to not leak the implementation to the client
import type { RpcService } from "./rpcs.js"

// must be identical to path in route.ts
export const route = "/_rpc"

/**
 * The RPC client.
 *
 * This is used by the client to call RPC functions.
 */
export const rpc = rpcClient<RpcService>(publicEnv.PUBLIC_SERVER_BASE_URL + route)
