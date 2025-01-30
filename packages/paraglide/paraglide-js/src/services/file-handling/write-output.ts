import path from "node:path";
import crypto from "node:crypto";
import type nodeFs from "node:fs/promises";

let previousOutputHash: string | undefined;

export async function writeOutput(
	outputDirectory: string,
	output: Record<string, string>,
	fs: typeof nodeFs
) {
	// if the output hasn't changed, don't write it
	const currentOutputHash = hashOutput(output, outputDirectory);
	if (currentOutputHash === previousOutputHash) return;

	// disabled because of https://github.com/opral/inlang-paraglide-js/issues/350
	// // clear the output directory
	// await fs.rm(outputDirectory, { recursive: true, force: true });
	// await fs.mkdir(outputDirectory, { recursive: true });

	//Create missing directories inside the output directory
	await Promise.allSettled(
		Object.keys(output).map(async (filePath) => {
			const fullPath = path.resolve(outputDirectory, filePath);
			const directory = path.dirname(fullPath);
			await fs.mkdir(directory, { recursive: true });
		})
	);

	//Write files
	await Promise.allSettled(
		Object.entries(output).map(async ([filePath, fileContent]) => {
			const fullPath = path.resolve(outputDirectory, filePath);
			await fs.writeFile(fullPath, fileContent);
		})
	);

	//Only update the previousOutputHash if the write was successful
	previousOutputHash = currentOutputHash;
}

function hashOutput(
	output: Record<string, string>,
	outputDirectory: string
): string {
	const hash = crypto.createHash("sha256");
	hash.update(JSON.stringify(output));
	hash.update(outputDirectory);
	return hash.digest("hex");
}
