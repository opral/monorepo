import type { SetStoreFunction } from "solid-js/store"
import type { LocalStorageSchema } from "../../../services/local-storage/index.js"
import { getAuthClient } from "@lix-js/client"

const browserAuth = getAuthClient({
	gitHubProxyBaseUrl: import.meta.env.PUBLIC_GIT_PROXY_BASE_URL,
	githubAppName: import.meta.env.PUBLIC_LIX_GITHUB_APP_NAME,
	githubAppClientId: import.meta.env.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
})

/**
 * This function is called when the user clicks the "Sign Out" button.
 */
export async function onSignOut(args: { setLocalStorage: SetStoreFunction<LocalStorageSchema> }) {
	await browserAuth.logout()

	// sign out on the client by setting the user to undefined
	args.setLocalStorage("user", undefined)
}
