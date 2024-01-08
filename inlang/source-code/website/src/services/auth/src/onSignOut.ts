import type { SetStoreFunction } from "solid-js/store"
import type { LocalStorageSchema } from "../../../services/local-storage/index.js"
import { telemetryBrowser } from "@inlang/telemetry"
import { browserAuth } from "@lix-js/server"

/**
 * This function is called when the user clicks the "Sign Out" button.
 */
export async function onSignOut(args: { setLocalStorage: SetStoreFunction<LocalStorageSchema> }) {
	await browserAuth.logout()

	// sign out on the client by setting the user to undefined
	args.setLocalStorage("user", undefined)
	// https://posthog.com/docs/integrate/client/js#reset-after-logout
	telemetryBrowser.reset()
}
