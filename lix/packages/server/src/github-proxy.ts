import express, { Router } from "express"

import { decryptAccessToken } from "./auth/implementation.js"
import { getEnvVar } from "./util/getEnv.js"

const PATH = "/github-proxy/"

const allowedAuthUrls = getEnvVar("PUBLIC_ALLOWED_AUTH_URLS", {
	descirption: 'List of allowed base urls eg https://inlang.com,https://manage.inlang.com"',
}).split(",")
const JWE_SECRET = getEnvVar("JWE_SECRET")

/**
 * Routes for the GitHub service.
 *
 * Proxies requests and adds the authorization header.
 */
export const router: Router = Router()

// matching all routes after the path with '*'
// and proxying the request to the GitHub API
router.all(
	PATH + "*",
	// Parse & make HTTP request body available at `req.body`
	express.json(),
	async (request, response, next) => {
		try {
			const encryptedAccessToken = request.session?.encryptedAccessToken as string | undefined
			const decryptedAccessToken = encryptedAccessToken
				? await decryptAccessToken({
						JWE_SECRET_KEY: JWE_SECRET,
						jwe: encryptedAccessToken,
				  })
				: undefined

			// taking end of proxy path suffix as target url
			const targetUrl = request.url.split(PATH)[1]

			if (typeof targetUrl === "undefined") {
				response.status(400).send("Missing target url")
				return
			}

			if (!targetUrl.startsWith("https://api.github.com/")) {
				response.status(403).send("Only github supported")
				return
			}

			const res = await fetch(targetUrl, {
				method: request.method,
				// @ts-ignore
				headers: {
					authorization: decryptedAccessToken ? `Bearer ${decryptedAccessToken}` : undefined,
					"Content-Type": request.get("Content-Type"),
				},
				// fetch throws an error if a method is GET and a body is attached
				// the body comes from the express.text() middleware
				body:
					// need to stringify otherwise github's api returns an error
					request.method === "GET" ? undefined : JSON.stringify(request.body),
			})

			const origin = request.headers.origin as string

			if (allowedAuthUrls.includes(origin)) {
				response.set("Access-Control-Allow-Origin", origin)
			}

			response.set("Access-Control-Allow-Credentials", "true")
			response.set("Access-Control-Allow-Headers", "x-github-api-version, user-agent, content-type")
			response.set("Access-Control-Max-Age", "86400")

			if (targetUrl.endsWith("/user/emails") && res.status === 401 && decryptedAccessToken) {
				response.statusMessage = "token_invalid"
				response.status(401)
				response.send("token_invalid")
			} else if (res.headers.get("content-type")?.includes("json")) {
				response
					.status(res.status)
					.contentType(res.headers.get("content-type") || "application/json")
					.send(await res.json())
			} else {
				response.status(res.status).send(res.body)
			}
		} catch (error) {
			console.error("ERROR in github service: ", error)
			next(error)
		}
	}
)
