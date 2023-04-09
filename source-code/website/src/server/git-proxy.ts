/**
 * ------------------------------------
 * The git proxy routes and authenticates requests
 * to git hosts like GitHub and GitLab.
 *
 * The proxy exists to avoid CORS issues and authenticate
 * requests.
 * ------------------------------------
 */

// import { assert } from "@src/services/assert/index.js";
import type { NextFunction, Request, Response } from "express"
// @ts-ignore
import createMiddleware from "@isomorphic-git/cors-proxy/middleware.js"
import { decryptAccessToken } from "@src/services/auth/index.server.js"
import { privateEnv } from "@inlang/env-variables"

const middleware = createMiddleware({})

export async function proxy(request: Request, response: Response, next: NextFunction) {
	// TODO enable after https://github.com/brillout/vite-plugin-ssr/discussions/560#discussioncomment-4420315
	// TODO currently not using vite to bundle this file, hence the call below will not be pruned
	// assert(request.url.startsWith(env.VITE_GIT_REQUEST_PROXY_PATH));
	if (request.path.includes("github") === false) {
		response.status(500).send("Unsupported git hosting provider.")
	}
	try {
		// decrypt the access token
		const encryptedAccessToken = request.session?.encryptedAccessToken
		if (encryptedAccessToken) {
			const decryptedAccessToken = await decryptAccessToken({
				JWE_SECRET_KEY: privateEnv.JWE_SECRET,
				jwe: encryptedAccessToken,
			})
			// set the authorization header (must be base64 encoded)
			request.headers["authorization"] = `Basic ${btoa(decryptedAccessToken)}`
		}
		// remove the proxy path from the url
		request.url = request.url.slice(privateEnv.PUBLIC_GIT_PROXY_PATH.length)
		middleware(request, response, next)
	} catch (error) {
		next(error)
	}
}
