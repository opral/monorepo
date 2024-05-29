import type { SetStoreFunction } from "solid-js/store"
import type { LocalStorageSchema } from "../../../services/local-storage/index.js"
import { publicEnv } from "@inlang/env-variables"
import { posthog as telemetryBrowser } from "posthog-js"
import { getAuthClient } from "@lix-js/client"

const browserAuth = getAuthClient({
	gitHubProxyBaseUrl: publicEnv.PUBLIC_GIT_PROXY_BASE_URL,
	githubAppName: publicEnv.PUBLIC_LIX_GITHUB_APP_NAME,
	githubAppClientId: publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
})

/**
 * This function is called when the user clicks the "Sign Out" button.
 */
export async function onSignOut(args: { setLocalStorage: SetStoreFunction<LocalStorageSchema> }) {
	// sign out on the server
	const hasExternalGitProxy =
		publicEnv.PUBLIC_SERVER_BASE_URL !== publicEnv.PUBLIC_GIT_PROXY_BASE_URL

	if (hasExternalGitProxy) {
		await Promise.allSettled([
			fetch("/services/auth/sign-out", { method: "POST" }),
			browserAuth.logout(),
		])
	} else {
		await fetch("/services/auth/sign-out", { method: "POST" })
	}

	// sign out on the client by setting the user to undefined
	args.setLocalStorage("user", { isLoggedIn: false })
	// https://posthog.com/docs/integrate/client/js#reset-after-logout
	telemetryBrowser.reset()
}
