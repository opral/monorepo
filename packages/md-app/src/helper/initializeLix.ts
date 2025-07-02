import { openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { initLixInspector } from "@lix-js/inspector";
import { findLixFileInOpfs } from "./findLixInOpfs";

/**
 * Initialize the lix instance for the application
 * This replaces the old global lix management and provides a clean instance for LixProvider
 */
export async function initializeLix() {
	console.log("Initializing lix instance...");

	// Get the lix ID from URL parameters
	const urlParams = new URLSearchParams(window.location.search);
	const lixIdFromUrl = urlParams.get("lix");

	let lixFile: File | undefined;
	let lixId: string | undefined;

	if (lixIdFromUrl && lixIdFromUrl.trim() !== "") {
		console.log(`Loading lix from URL parameter: ${lixIdFromUrl}`);

		try {
			const lixFileInfo = await findLixFileInOpfs(lixIdFromUrl);
			if (lixFileInfo) {
				lixFile = await lixFileInfo.handle.getFile();
				lixId = lixFileInfo.id;
				console.log(`Found lix file: ${lixFileInfo.fullName}`);
			} else {
				console.warn(`Lix file with ID ${lixIdFromUrl} not found in OPFS`);
			}
		} catch (error) {
			console.error(`Error finding lix file for ID ${lixIdFromUrl}:`, error);
		}
	}

	// Create storage with path
	const storage = new OpfsStorage({ path: `${lixId || "new"}.lix` });

	// Import existing file data if found
	if (lixFile) {
		await storage.import(lixFile);
	}

	// Open the lix instance
	const lix = await openLix({
		providePlugins: [mdPlugin],
		storage,
	});

	// Initialize inspector for debugging
	if (import.meta.env.DEV) {
		initLixInspector({ lix });
	}

	return lix;
}
