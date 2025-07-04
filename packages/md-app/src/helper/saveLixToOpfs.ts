import { Lix } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { findLixFilesInOpfs, cleanupLixFilesInOpfs } from "./findLixInOpfs";

/**
 * Finds a unique "Untitled" name by adding sequential numbers like "Untitled (1)" when needed
 */
async function findUniqueUntitledName(): Promise<string> {
	const rootHandle = await getOriginPrivateDirectory();
	const existingNames = new Set<string>();

	// Collect all existing .lix file names
	for await (const [name, handle] of rootHandle) {
		if (handle.kind === "file" && name.endsWith(".lix")) {
			existingNames.add(name.replace(/\.lix$/, ""));
		}
	}

	// If "Untitled" doesn't exist, use it
	if (!existingNames.has("Untitled")) {
		return "Untitled";
	}

	// Otherwise find the first available "Untitled (n)"
	let counter = 1;
	while (existingNames.has(`Untitled (${counter})`)) {
		counter++;
	}

	return `Untitled (${counter})`;
}

export async function saveLixToOpfs(args: {
	lix: Lix;
	customFileName?: string;
}) {
	// Get the current Lix ID for identification purposes
	const lixId = await args.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// Find any existing files with this Lix ID
	const existingFiles = await findLixFilesInOpfs(lixId.value);

	// Determine the filename to use
	let fileName: string;
	if (args.customFileName) {
		// If a custom filename is provided, use it
		fileName = `${args.customFileName}.lix`;
	} else if (existingFiles.length > 0) {
		// If this Lix already has files, use the existing name
		fileName = `${existingFiles[0].name}.lix`;
	} else {
		// For new Lix files, find a unique "Untitled" name
		const uniqueName = await findUniqueUntitledName();
		fileName = `${uniqueName}.lix`;
	}

	const baseName = fileName.replace(/\.lix$/, "");

	// Save the file with the desired name
	const rootHandle = await getOriginPrivateDirectory();
	const fileHandle = await rootHandle.getFileHandle(fileName, {
		create: true,
	});
	const writable = await fileHandle.createWritable();
	const file = await args.lix.toBlob();
	await writable.write(file);
	await writable.close();

	// If we're renaming (customFileName provided), clean up any old files with the same ID
	if (args.customFileName) {
		await cleanupLixFilesInOpfs(lixId.value, baseName);
	}

	console.log(`Done saving Lix to OPFS: ${fileName}`);
}
