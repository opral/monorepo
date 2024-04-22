import { getEnvVar } from "../util/getEnv.js"
import { encryptAccessToken, exchangeInterimCodeForAccessToken } from "./implementation.js"
import { Router } from "express"

export const router: Router = Router()

const PUBLIC_LIX_GITHUB_APP_NAME = getEnvVar("PUBLIC_LIX_GITHUB_APP_NAME")
const installUrl = `https://github.com/apps/${PUBLIC_LIX_GITHUB_APP_NAME}/installations/new`

const PUBLIC_SERVER_BASE_URL = getEnvVar("PUBLIC_SERVER_BASE_URL", {
	descirption: "The base url of the server e.g. https://inlang.com - Must not end with a slash",
})
const callbackUrl = `${PUBLIC_SERVER_BASE_URL}/services/auth/auth-callback`

const PUBLIC_LIX_GITHUB_APP_CLIENT_ID = getEnvVar("PUBLIC_LIX_GITHUB_APP_CLIENT_ID")
const LIX_GITHUB_APP_CLIENT_SECRET = getEnvVar("LIX_GITHUB_APP_CLIENT_SECRET")
const PUBLIC_ALLOWED_AUTH_URLS = getEnvVar("PUBLIC_ALLOWED_AUTH_URLS")
const JWE_SECRET = getEnvVar("JWE_SECRET")

/**
 * OAuth flow from GitHub
 *
 * Be aware that the route set here is prefixed with /services/auth
 * and that the route is set in the GitHub app settings.
 */

const allowedAuthUrls = PUBLIC_ALLOWED_AUTH_URLS.split(",")
router.get("/github-auth-callback", async (request, response, next) => {
	try {
		// TODO: org installation
		// TODO: test harness
		// TODO: handle exchanged token expires_in, refresh_token, refresh_token_expires_in

		const setupAction = request.query.setup_action as string
		if (setupAction === "install" || setupAction === "update") {
			// We don't need app installation tokens as we only use user access tokens
			response.redirect(callbackUrl)
			return
		}

		const code = request.query.code as string
		const { access_token } = await exchangeInterimCodeForAccessToken({
			code,
			githubAppClientId: PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
			githubClientSecret: LIX_GITHUB_APP_CLIENT_SECRET,
		})

		const { installations } = await (
			await fetch(`https://api.github.com/user/installations`, {
				headers: {
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					authorization: `Bearer ${access_token}`,
				},
			})
		).json()

		const encryptedAccessToken = await encryptAccessToken({
			accessToken: access_token,
			JWE_SECRET_KEY: JWE_SECRET,
		})

		// set the session
		request.session = {
			encryptedAccessToken,
		}

		// we currently do not support org installations, we only look at user installations for now in case someone accidentally installs the app as org
		if (
			installations.filter((installation: any) => installation.target_type === "User").length === 0
		) {
			// if app not installed, redirect via the install permissions url
			response.redirect(installUrl)
		} else {
			response.redirect(callbackUrl)
		}
	} catch (error) {
		next(error)
	}
})

/**
 * Sign out by setting the session to undefined.
 */
router.post("/sign-out", (request, response) => {
	const origin = request.headers.origin as string

	if (allowedAuthUrls.includes(origin)) {
		response.set("Access-Control-Allow-Origin", origin)
	}

	response.set("Access-Control-Allow-Credentials", "true")

	request.session = undefined
	response.status(201).send()
})
