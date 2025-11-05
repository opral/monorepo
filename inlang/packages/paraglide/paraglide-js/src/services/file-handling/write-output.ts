import path from "node:path";
import type { Stats } from "node:fs";
import type nodeFs from "node:fs/promises";

const cleanDirectorySafetyCache = new Map<string, { mtimeMs: number | undefined }>();

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
                await ensureSafeToCleanDirectory({
                        directory: args.directory,
                        fs: args.fs,
                        output: args.output,
                        previousOutputHashes: args.previousOutputHashes,
                });
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

        try {
                const stats = await args.fs.stat(args.directory);
                cleanDirectorySafetyCache.set(path.resolve(args.directory), {
                        mtimeMs: stats.mtimeMs,
                });
        } catch {
                cleanDirectorySafetyCache.delete(path.resolve(args.directory));
        }

        //Only update the previousOutputHashes if the write was successful
        return currentOutputHashes;
}

/**
 * Guard against wiping unrelated user files when cleaning the output directory.
 *
 * This exists because users accidentally pointed `outdir` to their project root
 * and lost work when the compiler cleared the directory.
 * https://github.com/opral/inlang-sdk/issues/245
 */
async function ensureSafeToCleanDirectory(args: {
        directory: string;
        fs: typeof nodeFs;
        output: Record<string, string>;
        previousOutputHashes?: Record<string, string>;
}) {
        const absoluteDirectory = path.resolve(args.directory);
        const cached = cleanDirectorySafetyCache.get(absoluteDirectory);

        let directoryStats: Stats;
        try {
                directoryStats = await args.fs.stat(absoluteDirectory);
        } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                        cleanDirectorySafetyCache.set(absoluteDirectory, { mtimeMs: undefined });
                        return;
                }
                throw error;
        }

        if (cached && cached.mtimeMs === directoryStats.mtimeMs) {
                return;
        }

        let existingEntries: Set<string>;
        try {
                existingEntries = await collectExistingEntries(args.fs, absoluteDirectory);
        } catch (error) {
                throw error;
        }

        const knownEntries = new Set<string>();
        const registerKnownPath = (filePath: string) => {
                const segments = filePath
                        .split(/\\|\//)
                        .map((segment) => segment.trim())
                        .filter(Boolean);
                if (segments.length === 0) {
                        return;
                }
                let current = "";
                for (const segment of segments) {
                        current = current ? `${current}/${segment}` : segment;
                        knownEntries.add(current);
                }
        };

        for (const filePath of Object.keys(args.output)) {
                registerKnownPath(filePath);
        }

        if (args.previousOutputHashes) {
                for (const filePath of Object.keys(args.previousOutputHashes)) {
                        registerKnownPath(filePath);
                }
        }
        const unknownEntries = Array.from(existingEntries).filter(
                (entry) => entry !== "." && entry !== ".." && !knownEntries.has(entry)
        );

        if (unknownEntries.length > 0) {
                const entryList = unknownEntries.join(", ");
                throw new Error(
                        `Refusing to clean "${absoluteDirectory}" because it contains files that are not generated by @inlang/paraglide-js (${entryList}). ` +
                                "Please configure the 'outdir' to point to a dedicated directory before recompiling."
                );
        }

        cleanDirectorySafetyCache.set(absoluteDirectory, { mtimeMs: directoryStats.mtimeMs });
}

async function collectExistingEntries(
        fs: typeof nodeFs,
        absoluteDirectory: string,
        baseDirectory = absoluteDirectory,
        results = new Set<string>()
): Promise<Set<string>> {
        const entries = await fs.readdir(absoluteDirectory);

        for (const entry of entries) {
                if (entry === "." || entry === "..") {
                        continue;
                }

                const absoluteEntryPath = path.join(absoluteDirectory, entry);
                const relativePath = path
                        .relative(baseDirectory, absoluteEntryPath)
                        .split(path.sep)
                        .filter(Boolean)
                        .join("/");

                if (relativePath) {
                        results.add(relativePath);
                }

                try {
                        const stats = await fs.stat(absoluteEntryPath);
                        if (stats.isDirectory()) {
                                await collectExistingEntries(fs, absoluteEntryPath, baseDirectory, results);
                        }
                } catch {
                        // ignore stat errors and treat entry as file-like
                }
        }

        return results;
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
