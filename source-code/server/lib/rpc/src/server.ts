import { inferAsyncReturnType, initTRPC } from "@trpc/server"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import { procedures } from "./procedures/index.js"
import express from "express"

/**
 * The TRPC instance.
 */
export const t = initTRPC.context<Context>().create()

/**
 * Inferred type of the TRPC router.
 *
 * Provides typesafety on the client.
 */
export type TrpcRouter = typeof trpcRouter

/**
 * Express middleware.
 */
export { middleware }

/**
 * Context available to all procedures.
 *
 * Useful for auth (in the future).
 */
function createContext() {
	return {}
}

/**
 * Inferred type of the context.
 */
type Context = inferAsyncReturnType<typeof createContext>

/**
 * The TRPC router.
 *
 * Takes the procedures and creates a router.
 */
const trpcRouter = t.router(procedures)

/**
 * Express middleware.
 *
 * This is the entrypoint for the API.
 */
const middleware = express.Router().use(
	"/trpc",
	createExpressMiddleware({
		router: trpcRouter,
		createContext,
	}),
)
