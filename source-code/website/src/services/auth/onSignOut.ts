import type { SetStoreFunction } from "solid-js/store";
import type { LocalStorageSchema } from "../local-storage/schema.js";

/**
 * This function is called when the user clicks the "Sign Out" button.
 */
export async function onSignOut(args: {
	setLocalStorage: SetStoreFunction<LocalStorageSchema>;
}) {
	// sign out on the server
	await fetch("/services/auth/sign-out", { method: "POST" });
	// sign out on the client by setting the user to undefined
	args.setLocalStorage("user", undefined);
}
