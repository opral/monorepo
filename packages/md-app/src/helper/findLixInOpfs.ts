import { openLixInMemory } from "@lix-js/sdk";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

export interface LixFileInfo {
	handle: FileSystemFileHandle;
	name: string; // File name without extension
	fullName: string; // File name with extension
	id: string; // The lix_id
}

/**
 * Finds all Lix files in OPFS with the specified ID
 *
 * @param lixId The Lix ID to search for (if not provided, returns all Lix files)
 * @param providePlugins Optional array of plugins to provide when opening the Lix
 * @returns Promise resolving to an array of LixFileInfo objects
 */
export async function findLixFilesInOpfs(
	lixId?: string,
	providePlugins = [mdPlugin]
): Promise<LixFileInfo[]> {
	try {
		const rootHandle = await getOriginPrivateDirectory();
		const results: LixFileInfo[] = [];

		// Scan all .lix files in OPFS
		for await (const [name, handle] of rootHandle) {
			if (handle.kind === "file" && name.endsWith(".lix")) {
				try {
					// Get a fresh file handle to avoid stale references
					const fileHandle = await rootHandle.getFileHandle(name);

					// Try to get the file with additional error handling and retry logic
					let file: File | null = null;
					let retryCount = 0;
					const maxRetries = 3;

					while (retryCount < maxRetries) {
						try {
							file = await fileHandle.getFile();
							break; // Success, exit retry loop
						} catch (fileError) {
							retryCount++;
							if (retryCount >= maxRetries) {
								console.warn(
									`Could not read file ${name} after ${maxRetries} attempts, skipping:`,
									fileError
								);
								break;
							}
							// Wait a bit before retrying
							await new Promise((resolve) =>
								setTimeout(resolve, 100 * retryCount)
							);
						}
					}

					// If we couldn't get the file after retries, skip this file
					if (!file) {
						continue;
					}

					const tempBlob = new Blob([await file.arrayBuffer()]);

					// Open the Lix to check its ID
					const tempLix = await openLixInMemory({
						blob: tempBlob,
						providePlugins,
					});

					const tempLixId = await tempLix.db
						.selectFrom("key_value")
						.where("key", "=", "lix_id")
						.select("value")
						.executeTakeFirst();

					// If no specific ID was requested, or if this file matches the requested ID
					if (!lixId || tempLixId?.value === lixId) {
						results.push({
							handle: fileHandle as FileSystemFileHandle,
							name: name.replace(/\.lix$/, ""),
							fullName: name,
							id: tempLixId?.value || "",
						});
					}
				} catch (e) {
					console.error(`Error reading file ${name}:`, e);
					// Skip if we can't read this file
				}
			}
		}

		return results;
	} catch (error) {
		console.error("Error accessing OPFS:", error);
		return [];
	}
}

/**
 * Finds a single Lix file in OPFS with the specified ID
 *
 * @param lixId The Lix ID to search for
 * @param providePlugins Optional array of plugins to provide when opening the Lix
 * @returns Promise resolving to a LixFileInfo object or undefined if not found
 */
export async function findLixFileInOpfs(
	lixId: string,
	providePlugins = [mdPlugin]
): Promise<LixFileInfo | undefined> {
	const files = await findLixFilesInOpfs(lixId, providePlugins);
	return files.length > 0 ? files[0] : undefined;
}

/**
 * Checks if a file exists and is readable in OPFS
 *
 * @param fileName The name of the file to check
 * @returns Promise resolving to boolean indicating if file is accessible
 */
export async function isFileAccessible(fileName: string): Promise<boolean> {
	try {
		const rootHandle = await getOriginPrivateDirectory();
		const fileHandle = await rootHandle.getFileHandle(fileName);
		await fileHandle.getFile();
		return true;
	} catch {
		return false;
	}
}

/**
 * Removes all Lix files in OPFS with the specified ID except the one with the specified name
 *
 * @param lixId The Lix ID to clean up
 * @param keepName Optional name to keep (if specified, files with this name won't be removed)
 * @returns Promise resolving to an array of removed file names
 */
export async function cleanupLixFilesInOpfs(
	lixId: string,
	keepName?: string
): Promise<string[]> {
	const files = await findLixFilesInOpfs(lixId);
	const rootHandle = await getOriginPrivateDirectory();
	const removedFiles: string[] = [];

	for (const file of files) {
		// Skip the file we want to keep
		if (keepName && file.name === keepName) {
			continue;
		}

		try {
			await rootHandle.removeEntry(file.fullName);
			removedFiles.push(file.fullName);
			console.log(`Removed old Lix file: ${file.fullName}`);
		} catch (error) {
			console.error(`Failed to remove file ${file.fullName}:`, error);
		}
	}

	return removedFiles;
}
