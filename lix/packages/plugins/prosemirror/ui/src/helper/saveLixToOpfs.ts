import { Lix, toBlob } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { getDefaultStore } from "jotai";
import { withPollingAtom } from "../state";

/**
 * Saves the lix database to the Origin Private File System
 */
export async function saveLixToOpfs(args: { lix: Lix }) {
	try {
		const store = getDefaultStore();

		// Get the lix ID from the database
		const lixId = await args.lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.select("value")
			.executeTakeFirstOrThrow();

		const lixFileId = lixId.value;

		// Get the root directory of the OPFS
		const rootHandle = await getOriginPrivateDirectory();

		// Create/open a file handle
		const fileHandle = await rootHandle.getFileHandle(`${lixFileId}.lix`, {
			create: true,
		});

		// Create a writable stream
		const writable = await fileHandle.createWritable();

		// Convert the lix database to a blob
		const file = await toBlob({ lix: args.lix });

		// Write the blob to the file
		await writable.write(file);

		// Close the writable stream
		await writable.close();

		// Update the polling atom to trigger reactive updates
		store.set(withPollingAtom, Date.now());

		console.log(`Successfully saved lix ${lixFileId} to OPFS`);
		return true;
	} catch (error) {
		console.error("Error saving lix to OPFS:", error);
		return false;
	}
}

/**
 * Deletes all lix files from the Origin Private File System
 */
export async function resetOpfs() {
	try {
		const rootHandle = await getOriginPrivateDirectory();

		// List all files in the root directory
		const entries = await rootHandle.values();

		// Track the number of deleted files
		let deletedCount = 0;

		// Iterate through all entries
		for await (const entry of entries) {
			// Check if it's a file and ends with .lix
			if (entry.name.endsWith(".lix")) {
				// Remove the file
				await rootHandle.removeEntry(entry.name);
				deletedCount++;
				console.log(`Deleted ${entry.name} from OPFS`);
			}
		}

		console.log(`Reset complete. Removed ${deletedCount} lix files from OPFS`);
		return true;
	} catch (error) {
		console.error("Error resetting OPFS:", error);
		return false;
	}
}

/**
 * Lists all lix files in the Origin Private File System
 */
export async function listOpfsFiles() {
	try {
		const rootHandle = await getOriginPrivateDirectory();
		const entries = await rootHandle.values();

		const files: string[] = [];

		for await (const entry of entries) {
			if (entry.name.endsWith(".lix")) {
				files.push(entry.name);
			}
		}

		return files;
	} catch (error) {
		console.error("Error listing OPFS files:", error);
		return [];
	}
}
