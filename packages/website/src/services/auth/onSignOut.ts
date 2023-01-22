import type { SetStoreFunction } from "solid-js/store";
import type { SetLocalStorage } from "../local-storage/LocalStorageProvider.jsx";
import type { LocalStorageSchema } from "../local-storage/schema.js";

/**
 * This function is called when the user clicks the "Sign Out" button.
 */
export async function onSignOut(args: {
	setLocalStorage: SetLocalStorage;
	onlyClientSide?: boolean;
}) {
	if (!args.onlyClientSide) {
		// sign out on the server
		await fetch("/services/auth/sign-out", { method: "POST" });
	}

	args.setLocalStorage("user", undefined);
}
