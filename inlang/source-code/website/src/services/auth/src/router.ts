import { privateEnv } from "@inlang/env-variables"
import express from "express"
import { encryptAccessToken, exchangeInterimCodeForAccessToken } from "./implementation.js"

/**
 * Routes for the auth service
 */
export const router = express.Router()

/**
 * OAuth flow from GitHub
 *
 * Be aware that the route set here is prefixed with /services/auth
 * and that the route is set in the GitHub OAuth app settings.
 */
router.get("/github-oauth-callback", async (request, response, next) => {
	try {
		const code = request.query.code as string
		const accessToken = await exchangeInterimCodeForAccessToken({ code, env: privateEnv })
		const encryptedAccessToken = await encryptAccessToken({
			accessToken,
			JWE_SECRET_KEY: privateEnv.JWE_SECRET,
		})
		// set the session
		request.session = {
			encryptedAccessToken,
		}

		const hasExternalGitProxy =
			privateEnv.PUBLIC_SERVER_BASE_URL !== privateEnv.PUBLIC_GIT_PROXY_BASE_URL

		if (hasExternalGitProxy) {
			response.redirect(
				`${privateEnv.PUBLIC_GIT_PROXY_BASE_URL}/services/auth/github-forwarded-oauth-callback?encryptedAccessToken=${encryptedAccessToken}&callback=${privateEnv.PUBLIC_SERVER_BASE_URL}/services/auth/oauth-callback`,
			)
		} else {
			response.redirect("/services/auth/oauth-callback")
		}
	} catch (error) {
		next(error)
	}
})

/**
 * Sign out by setting the session to undefined.
 */
router.post("/sign-out", (request, response) => {
	request.session = undefined
	response.status(201).send()
})
