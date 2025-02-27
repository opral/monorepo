import path from "node:path";
import crypto from "node:crypto";
import type nodeFs from "node:fs/promises";

export async function writeOutput(args: {
	directory: string;
	output: Record<string, string>;
	cleanDirectory?: boolean;
	fs: typeof nodeFs;
	previousOutputHashes?: Record<string, string>;
}) {
	const currentOutputHashes = hashOutput(args.output, args.directory);

	// if the output hasn't changed, don't write it
	const changedFiles = new Set();

	for (const [filePath, hash] of Object.entries(currentOutputHashes)) {
		if (args.previousOutputHashes?.[filePath] !== hash) {
			changedFiles.add(filePath);
		}
	}

	if (changedFiles.size === 0) {
		return currentOutputHashes;
	}

	// clear the output directory
	//
	// disabled because of https://github.com/opral/inlang-paraglide-js/issues/350
	// and re-enabled because of https://github.com/opral/inlang-paraglide-js/issues/420
	if (args.cleanDirectory) {
		await args.fs.rm(args.directory, { recursive: true, force: true });
	}
	await args.fs.mkdir(args.directory, { recursive: true });

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

function hashOutput(
	output: Record<string, string>,
	outputDirectory: string
): Record<string, string> {
	const hashes: Record<string, string> = {};
	for (const [filePath, fileContent] of Object.entries(output)) {
		const hash = crypto.createHash("sha256");
		hash.update(fileContent);
		hash.update(path.resolve(outputDirectory, filePath));
		hashes[filePath] = hash.digest("hex");
	}
	return hashes;
}
