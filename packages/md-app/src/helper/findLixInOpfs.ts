import { openLix } from "@lix-js/sdk";
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

		// Collect all .lix files first for parallel processing
		const lixFiles: string[] = [];
		for await (const [name, handle] of rootHandle) {
			if (handle.kind === "file" && name.endsWith(".lix")) {
				lixFiles.push(name);
			}
		}

		// Process files in parallel with limited concurrency to avoid overwhelming the system
		const processFile = async (name: string): Promise<LixFileInfo | null> => {
			try {
				// Get a fresh file handle to avoid stale references
				const fileHandle = await rootHandle.getFileHandle(name);

				// Cache miss or expired - read file with optimized retry logic
				let file: File | null = null;
				let retryCount = 0;
				const maxRetries = 2; // Reduced from 3 retries

				while (retryCount < maxRetries) {
					try {
						file = await fileHandle.getFile();
						break; // Success, exit retry loop
					} catch (fileError) {
						retryCount++;

						// Don't retry certain types of errors
						if (fileError instanceof DOMException) {
							switch (fileError.name) {
								case "NotReadableError":
									console.warn(
										`File ${name} not readable (permission denied), skipping:`,
										fileError.message
									);
									return null;
								case "SecurityError":
									console.warn(
										`Security restriction for file ${name}, skipping:`,
										fileError.message
									);
									return null;
								case "NotFoundError":
									console.warn(
										`File ${name} not found, skipping:`,
										fileError.message
									);
									return null;
							}
						}

						if (retryCount >= maxRetries) {
							console.warn(
								`Could not read file ${name} after ${maxRetries} attempts, skipping:`,
								fileError
							);
							break;
						}
						// Reduced retry delay for better performance
						await new Promise((resolve) =>
							setTimeout(resolve, 50 * retryCount)
						);
					}
				}

				// If we couldn't get the file after retries, skip this file
				if (!file) {
					return null;
				}

				const tempBlob = new Blob([await file.arrayBuffer()]);

				// Open the Lix to check its ID
				const tempLix = await openLix({
					blob: tempBlob,
					providePlugins,
				});

				const tempLixId = await tempLix.db
					.selectFrom("key_value")
					.where("key", "=", "lix_id")
					.select("value")
					.executeTakeFirst();

				const lixNameValue = await tempLix.db
					.selectFrom("key_value")
					.where("key", "=", "lix_name")
					.select("value")
					.executeTakeFirst();

				const lixIdValue = tempLixId?.value || "";

				// Cache the result
				// opfsCache.set(name, {
				// 	id: lixIdValue,
				// 	name: name.replace(/\.lix$/, ""),
				// 	fullName: name,
				// 	lastModified: now,
				// });

				// If no specific ID was requested, or if this file matches the requested ID
				if (!lixId || lixIdValue === lixId) {
					return {
						handle: fileHandle as FileSystemFileHandle,
						name: lixNameValue?.value || name.replace(/\.lix$/, ""),
						fullName: name,
						id: lixIdValue,
					};
				}
				return null;
			} catch (e) {
				// Handle different types of file errors
				if (e instanceof DOMException) {
					switch (e.name) {
						case "NotReadableError":
							console.warn(
								`File ${name} not readable (permission denied), skipping:`,
								e.message
							);
							break;
						case "NotFoundError":
							console.warn(`File ${name} not found, skipping:`, e.message);
							break;
						case "SecurityError":
							console.warn(
								`Security restriction for file ${name}, skipping:`,
								e.message
							);
							break;
						default:
							console.error(
								`OPFS error reading file ${name}:`,
								e.name,
								e.message
							);
					}
				} else {
					console.error(`Error reading file ${name}:`, e);
				}
				return null;
			}
		};

		// Process files in parallel with limited concurrency (max 3 concurrent)
		const processInBatches = async (
			files: string[],
			batchSize: number = 3
		): Promise<LixFileInfo[]> => {
			const results: LixFileInfo[] = [];

			for (let i = 0; i < files.length; i += batchSize) {
				const batch = files.slice(i, i + batchSize);
				const batchResults = await Promise.all(batch.map(processFile));

				// Filter out null results and add to results array
				results.push(
					...batchResults.filter(
						(result): result is LixFileInfo => result !== null
					)
				);
			}

			return results;
		};

		// Process all files in parallel batches
		const parallelResults = await processInBatches(lixFiles);
		results.push(...parallelResults);

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
	} catch (error) {
		if (error instanceof DOMException) {
			switch (error.name) {
				case 'NotReadableError':
					console.warn(`File ${fileName} not readable (permission issue):`, error.message);
					return false;
				case 'NotFoundError':
					// File doesn't exist, this is expected
					return false;
				case 'SecurityError':
					console.warn(`Security restriction for file ${fileName}:`, error.message);
					return false;
				default:
					console.warn(`OPFS error for file ${fileName}:`, error.name, error.message);
					return false;
			}
		}
		console.warn(`Unexpected error checking file ${fileName}:`, error);
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
