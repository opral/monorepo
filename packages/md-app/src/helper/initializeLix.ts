import { openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { initLixInspector } from "@lix-js/inspector";
import { updateUrlParams } from "./updateUrlParams";
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

	// Get the actual lix ID from the key_value table
	const lixIdResult = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// Check if any files exist, if not create a welcome file
	const existingFiles = await lix.db.selectFrom("file").select("id").execute();

	if (existingFiles.length === 0) {
		console.log("No files found, creating welcome file...");
		await lix.db
			.insertInto("file")
			.values({
				path: "/document.md",
				data: new TextEncoder().encode(
					"# Welcome to Flashtype.ai\n\nStart writing your document here..."
				),
			})
			.execute();

		// Get the created file to set it as active
		const welcomeFile = await lix.db
			.selectFrom("file")
			.where("path", "=", "/document.md")
			.select("id")
			.executeTakeFirst();

		if (welcomeFile) {
			// Update URL to point to the welcome file
			updateUrlParams({ f: welcomeFile.id });
		}
	}

	// Update URL if lix ID has changed
	if (lixIdResult.value !== lixIdFromUrl) {
		updateUrlParams({ lix: lixIdResult.value });
	}

	console.log(`Lix initialized with ID: ${lixIdResult.value}`);
	return lix;
}
