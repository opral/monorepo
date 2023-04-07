import { rpcClient } from "typed-rpc"
import { isDevelopment } from "../env/index.js"

// ! Only import the type to not leak the implementation to the client
import type { RpcService } from "./src/index.js"

// must be identical to path in route.ts
const route = "/shared/rpc"

/**
 * The RPC client.
 *
 * This is used by the client to call RPC functions.
 */
export const rpc = rpcClient<RpcService>(
	(isDevelopment ? "http://localhost:3000" : "https://inlang.com") + route,
)
