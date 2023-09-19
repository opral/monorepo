import { privateEnv } from "@inlang/env-variables"
import { Router } from "express"

// @ts-ignore
export const router: Router = Router()

/**
 * OAuth flow for forwarding the encrypted token from the webiste to the lix server, this will be reversed  once the setup runs smoothly
 */
router.get("/github-forwarded-oauth-callback", async (request, response, next) => {
	try {
		const encryptedAccessToken = request.query.encryptedAccessToken as string
		const callback = request.query.callback as string
		// set the session
		// @ts-ignore
		request.session = {
			encryptedAccessToken,
		}

		response.redirect(callback)
	} catch (error) {
		next(error)
	}
})

/**
 * Sign out by setting the session to undefined.
 * FIXME: hanlde logout!
 */
router.post("/sign-out", (request, response) => {
	response.set("Access-Control-Allow-Origin", privateEnv.PUBLIC_SERVER_BASE_URL)
	response.set("Access-Control-Allow-Credentials", "true")

	// @ts-ignore
	request.session = undefined
	response.status(201).send()
})
