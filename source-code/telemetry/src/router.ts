import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import { ROUTE_PATH } from "./implementation/shared.js"

export const router = express.Router()

router.use(
	ROUTE_PATH,
	createProxyMiddleware({
		target: "https://eu.posthog.com",
		changeOrigin: true,
		onProxyReq: (req) => {
			// remove the path from forwarded request
			req.path = req.path.slice(ROUTE_PATH.length)
		},
	}),
)
