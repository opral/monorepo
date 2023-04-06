import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import { ROUTE_PATH } from "./shared.js"

/**
 * Routes for the service
 */
export const router = express.Router()

/**
 * Sign out by setting the session to undefined.
 */
router.use(
	ROUTE_PATH,
	createProxyMiddleware({
		target: "https://eu.posthog.com",
		changeOrigin: true,
		onProxyReq: (req) => {
			// remove the path from forwarded request
			//@ts-ignore
			req.path = req.path.slice(ROUTE_PATH.length)
		},
	}),
)
