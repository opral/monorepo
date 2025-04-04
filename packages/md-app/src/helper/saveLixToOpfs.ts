import { Lix, toBlob } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { getDefaultStore } from "jotai";
import { withPollingAtom } from "@/state";
import { findLixFilesInOpfs, cleanupLixFilesInOpfs } from "./findLixInOpfs";

export async function saveLixToOpfs(args: {
	lix: Lix;
	customFileName?: string;
}) {
	const store = getDefaultStore();

	// Get the current Lix ID for identification purposes
	const lixId = await args.lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// Find any existing files with this Lix ID
	const existingFiles = await findLixFilesInOpfs(lixId.value);
	
	// Determine the filename to use
	// If a custom filename is provided, use it
	// Otherwise, use the first existing file's name, or "Untitled" as a fallback
	const fileName = args.customFileName 
		? `${args.customFileName}.lix` 
		: existingFiles.length > 0 
			? `${existingFiles[0].name}.lix` 
			: "Untitled.lix";
			
	const baseName = fileName.replace(/\.lix$/, "");

	// Save the file with the desired name
	const rootHandle = await getOriginPrivateDirectory();
	const fileHandle = await rootHandle.getFileHandle(fileName, {
		create: true,
	});
	const writable = await fileHandle.createWritable();
	const file = await toBlob({ lix: args.lix });
	await writable.write(file);
	await writable.close();

	// If we're renaming (customFileName provided), clean up any old files with the same ID
	if (args.customFileName) {
		await cleanupLixFilesInOpfs(lixId.value, baseName);
	}

	store.set(withPollingAtom, Date.now());

	console.log(`Done saving Lix to OPFS: ${fileName}`);
}
