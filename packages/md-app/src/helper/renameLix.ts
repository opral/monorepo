import { Lix } from "@lix-js/sdk";
import { saveLixToOpfs } from "./saveLixToOpfs";

// Helper function to ensure a lix has a name
export async function ensureLixName({ lix }: { lix: Lix }): Promise<string> {
	// Use "Untitled" as default name
	const defaultName = "Untitled";
	await saveLixName({ lix, newName: defaultName });
	return defaultName;
}

// Helper function to save a lix name
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
		// The saveLixToOpfs function now handles finding existing files and cleanup
		await saveLixToOpfs({ lix, customFileName: trimmedName });

		// Update the URL to include the lix ID for routing
		const url = new URL(window.location.href);
		url.searchParams.set("lix", lixId.value);
		window.history.replaceState({}, "", url.toString());

		console.log(`Successfully renamed lix to: ${trimmedName}`);
	} catch (error) {
		console.error("Error during file renaming:", error);
	}
}
