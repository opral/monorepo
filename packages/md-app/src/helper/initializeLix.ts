import { Lix, newLixFile, openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { initLixInspector } from "@lix-js/inspector";
import { findLixFileInOpfs, findLixFilesInOpfs } from "./findLixInOpfs";

/**
 * Initialize the lix instance for the application
 * This replaces the old global lix management and provides a clean instance for LixProvider
 */
export async function initializeLix(
	lixIdFromUrl?: string | null
): Promise<{ lix: Lix; lixId?: string }> {
	let lixFile: File | undefined;
	let lixId: string | undefined;

	// Try to open a lix file from the URL parameter
	if (lixIdFromUrl && lixIdFromUrl.trim() !== "") {
		try {
			const lixFileInfo = await findLixFileInOpfs(lixIdFromUrl);
			if (lixFileInfo) {
				lixFile = await lixFileInfo.handle.getFile();
				lixId = lixFileInfo.id;
			} else {
				console.warn(`Lix file with ID ${lixIdFromUrl} not found in OPFS`);
			}
		} catch (error) {
			console.error(`Error finding lix file for ID ${lixIdFromUrl}:`, error);
		}
	}

	// If no specific ID was provided, search for existing lix files in OPFS
	if (!lixFile) {
		const files = await findLixFilesInOpfs();
		if (files.length > 0) {
			// Use the first file found if no specific ID was provided
			lixFile = await files[0].handle.getFile();
			lixId = files[0].id;
		} else {
			console.warn("No existing lix files found in OPFS");
		}
	}

	let lix = undefined;

	if (lixFile) {
		// Import existing file data if found
		const storage = new OpfsStorage({ path: `${lixId}.lix` });
		await storage.import(lixFile);
		lix = await openLix({
			providePlugins: [mdPlugin],
			storage,
		});
	} else {
		// Create a new lix file if no file was found
		const _newLixFile = await newLixFile();
		lixId = _newLixFile._lix.id;
		lix = await openLix({
			blob: _newLixFile,
			providePlugins: [mdPlugin],
			storage: new OpfsStorage({ path: `${lixId}.lix` }),
		});
	}

	// Initialize inspector for debugging
	if (import.meta.env.DEV) {
		initLixInspector({
			lix,
			show: localStorage.getItem("lix-inspector:show")
				? localStorage.getItem("lix-inspector:show") === "true"
				: import.meta.env.DEV,
		});
	}

	return { lix, lixId };
}
