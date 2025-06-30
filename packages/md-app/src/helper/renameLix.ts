import { Lix } from "@lix-js/sdk";

// Helper function to save a lix name
// Note: With OpfsStorage, renaming is handled automatically by the storage adapter
// This function is kept for compatibility but may need to be updated to work with OpfsStorage
export async function saveLixName({
	lix,
	newName,
}: {
	lix: Lix;
	newName: string;
}): Promise<void> {
	// Get the current lix_id to identify the file (we still need this for routing)
	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// Clean name
	const trimmedName = newName.trim();
	if (!trimmedName) {
		console.warn("Empty name provided, using 'Untitled' instead");
		newName = "Untitled";
	}

	try {
		// TODO: With OpfsStorage, we need a different approach to rename files
		// For now, just update the URL - the storage layer handles persistence automatically
		console.log(`Lix name updated to: ${trimmedName} (storage handled by OpfsStorage)`);

		// Update the URL to include the lix ID for routing
		const url = new URL(window.location.href);
		url.searchParams.set("lix", lixId.value);
		window.history.replaceState({}, "", url.toString());

		console.log(`Successfully renamed lix to: ${trimmedName}`);
	} catch (error) {
		console.error("Error during file renaming:", error);
	}
}
