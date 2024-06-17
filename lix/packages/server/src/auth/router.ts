import { getEnvVar } from "../util/getEnv.js"
import { encryptAccessToken, exchangeInterimCodeForAccessToken } from "./implementation.js"
import { Router } from "express"

export const router: Router = Router()

const PUBLIC_LIX_GITHUB_APP_NAME = getEnvVar("PUBLIC_LIX_GITHUB_APP_NAME")
const installUrl = `https://github.com/apps/${PUBLIC_LIX_GITHUB_APP_NAME}/installations/new`

const PUBLIC_LIX_GITHUB_APP_CLIENT_ID = getEnvVar("PUBLIC_LIX_GITHUB_APP_CLIENT_ID")
const LIX_GITHUB_APP_CLIENT_SECRET = getEnvVar("LIX_GITHUB_APP_CLIENT_SECRET")
const PUBLIC_ALLOWED_AUTH_URLS = getEnvVar("PUBLIC_ALLOWED_AUTH_URLS")
const JWE_SECRET = getEnvVar("JWE_SECRET")
const PUBLIC_SERVER_BASE_URL = getEnvVar("PUBLIC_SERVER_BASE_URL")

const allowedAuthUrls = PUBLIC_ALLOWED_AUTH_URLS.split(",")

/**
 * OAuth flow from GitHub
 *
 * Be aware that the route set here is prefixed with /services/auth
 * and that the route is set in the GitHub app settings.
 */

router.get("/github-auth-callback", async (request, response, next) => {
	const state = request.query["state"]
	let callbackUrl = ""
	if (!state) {
		callbackUrl = PUBLIC_SERVER_BASE_URL + "/auth/auth-callback"
	} else {
		callbackUrl = decodeURI(state as string) as string
	}

	const callBackOrigin = new URL(callbackUrl).origin
	if (!allowedAuthUrls.includes(callBackOrigin)) {
		return next(new Error("Origin not allowed"))
	}

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
		const encryptedAccessToken = await encryptAccessToken({
			accessToken: access_token,
			JWE_SECRET_KEY: JWE_SECRET,
		})
		// set the session
		request.session = {
			encryptedAccessToken,
		}

		// TODO: investigate auto handling with PUT /user/installations/{installation_id}/repositories/{repository_id}

		const [{ installations }, user] = await Promise.all([
			fetch(`https://api.github.com/user/installations`, {
				headers: {
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					authorization: `Bearer ${access_token}`,
				},
			}).then((response) => response.json()),
			fetch(`https://api.github.com/user`, {
				headers: {
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					authorization: `Bearer ${access_token}`,
				},
			}).then((response) => response.json()),
		])

		// console.log(JSON.stringify(user, null, 2))
		// console.log(JSON.stringify(installations, null, 2))

		// we also see installations of everyone in our organization who isntalled the same app as user, so we need to filter out only our own!
		if (
			installations.filter(
				(installation: any) =>
					installation.target_type === "User" && user.id === installation.account?.id
			).length === 0
		) {
			// if app not installed, redirect via the install permissions url
			response.redirect(installUrl + "?state=" + encodeURIComponent(callbackUrl))
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
