import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"

// --------------- SETUP -----------------

export const isProduction = process.env.NODE_ENV === "production"

const app = express()

// ----------------- ROUTES ----------------------

app.use(
	"*",
	createProxyMiddleware({
		target: "https://eu.posthog.com",
		changeOrigin: true,
		onProxyReq: (req) => {
			req.path
		},
	})
)

// ----------------- START SERVER -----------------

const port = process.env.PORT ?? 4005
app.listen(port)
console.info(`Server running at http://localhost:${port}/`)
