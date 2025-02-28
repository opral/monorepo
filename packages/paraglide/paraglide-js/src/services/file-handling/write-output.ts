import path from "node:path";
import type nodeFs from "node:fs/promises";

export async function writeOutput(args: {
	directory: string;
	output: Record<string, string>;
	cleanDirectory?: boolean;
	fs: typeof nodeFs;
	previousOutputHashes?: Record<string, string>;
}) {
	const currentOutputHashes = await hashOutput(args.output, args.directory);

	// if the output hasn't changed, don't write it
	const changedFiles = new Set();

	for (const [filePath, hash] of Object.entries(currentOutputHashes)) {
		if (args.previousOutputHashes?.[filePath] !== hash) {
			changedFiles.add(filePath);
		}
	}

	// Find files that have been removed in the current output
	const filesToDelete = new Set<string>();
	if (args.previousOutputHashes) {
		for (const filePath of Object.keys(args.previousOutputHashes)) {
			if (!currentOutputHashes[filePath]) {
				filesToDelete.add(filePath);
			}
		}
	}

	if (changedFiles.size === 0 && filesToDelete.size === 0) {
		return currentOutputHashes;
	}

	// clear the output directory
	//
	// disabled because of https://github.com/opral/inlang-paraglide-js/issues/350
	// and re-enabled because of https://github.com/opral/inlang-paraglide-js/issues/420
	if (args.cleanDirectory) {
		await args.fs.rm(args.directory, { recursive: true, force: true });
	} else {
		await args.fs.mkdir(args.directory, { recursive: true });
	}
	// Delete files that have been removed
	// ignore if cleanDirectory is true because the directory will be cleaned anyway
	if (filesToDelete.size > 0 && !args.cleanDirectory) {
		await deleteRemovedFiles(args.fs, args.directory, filesToDelete);
	}

	//Create missing directories inside the output directory
	await Promise.allSettled(
		Object.keys(args.output).map(async (filePath) => {
			const fullPath = path.resolve(args.directory, filePath);
			const directory = path.dirname(fullPath);
			await args.fs.mkdir(directory, { recursive: true });
		})
	);

	//Write files
	await Promise.allSettled(
		Object.entries(args.output).map(async ([filePath, fileContent]) => {
			if (!changedFiles.has(filePath)) {
				return;
			}
			const fullPath = path.resolve(args.directory, filePath);
			await args.fs.writeFile(fullPath, fileContent);
		})
	);

	//Only update the previousOutputHashes if the write was successful
	return currentOutputHashes;
}

/**
 * Delete files that have been removed and clean up empty directories
 */
async function deleteRemovedFiles(
	fs: typeof nodeFs,
	baseDirectory: string,
	filesToDelete: Set<string>
) {
	// Collect directories that might need cleanup
	const potentialEmptyDirs = new Set<string>();

	// First pass: delete all files and collect parent directories
	await Promise.allSettled(
		Array.from(filesToDelete).map(async (filePath) => {
			const fullPath = path.resolve(baseDirectory, filePath);
			try {
				await fs.unlink(fullPath);

				// Add parent directory for potential cleanup
				const dirPath = path.dirname(fullPath);
				if (dirPath !== baseDirectory) {
					potentialEmptyDirs.add(dirPath);
				}
			} catch {
				// Ignore errors if the file doesn't exist
			}
		})
	);

	// Second pass: clean up empty directories, starting from deepest paths
	const sortedDirs = Array.from(potentialEmptyDirs).sort(
		(a, b) => b.length - a.length
	);

	for (const dirPath of sortedDirs) {
		// Only process directories within the base directory
		if (!dirPath.startsWith(baseDirectory) || dirPath === baseDirectory) {
			continue;
		}

		try {
			const dirContents = await fs.readdir(dirPath);
			if (dirContents.length === 0) {
				await fs.rmdir(dirPath);

				// Add parent directory for potential cleanup
				const parentDir = path.dirname(dirPath);
				if (parentDir !== baseDirectory) {
					sortedDirs.push(parentDir);
				}
			}
		} catch {
			// Ignore errors during directory cleanup
		}
	}
}

async function hashString(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashOutput(
	output: Record<string, string>,
	outputDirectory: string
): Promise<Record<string, string>> {
	const hashes: Record<string, string> = {};
	for (const [filePath, fileContent] of Object.entries(output)) {
		const combinedContent =
			fileContent + path.resolve(outputDirectory, filePath);
		hashes[filePath] = await hashString(combinedContent);
	}
	return hashes;
}
