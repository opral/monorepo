import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { TrpcRouter } from "./server.js"

/**
 * The RPC client.
 */
export const rpc = createTRPCProxyClient<TrpcRouter>({
	links: [
		httpBatchLink({
			url: "http://localhost:2022/trpc",
		}),
	],
})
