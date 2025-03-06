import { chromium } from "playwright";
import { builds, buildConfigToString } from "./build.config.ts";
import { startServer } from "./server.ts";
import fs from "node:fs";
import { runBuilds } from "./build.ts";
import csvToMarkdown from "csv-to-markdown-table";

// Function to benchmark network transfer
async function benchmarkBuild(url: string): Promise<number> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Track responses and their sizes
	const responsePromises: Promise<number>[] = [];
	page.on("response", (response) => {
		// Only add successful responses
		if (response.status() >= 200 && response.status() < 400) {
			const promise = response
				.body()
				.then((body) => body.length)
				.catch(() => 0);
			responsePromises.push(promise);
		}
	});

	console.log(`Benchmarking ${url}`);

	// Format URL properly with server address
	await page.goto(url, { waitUntil: "networkidle" });

	// Wait for all response promises to resolve before closing the browser
	const sizes = await Promise.all(responsePromises);
	const totalBytes = sizes.reduce((sum, size) => sum + size, 0);

	await browser.close();

	return totalBytes; // Return bytes
}

// Format bytes to human-readable format (B, KB)
function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	} else {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
}

async function runBenchmarks() {
	await runBuilds();

	// Get unique libraries, library modes, locales, messages
	const libraries = [...new Set(builds.map((build) => build.library))].sort(
		(a, b) =>
			a === "paraglide" ? -1 : b === "paraglide" ? 1 : a.localeCompare(b)
	);
	
	// Get library modes grouped by library
	const libraryModes: Record<string, string[]> = {};
	for (const build of builds) {
		if (!libraryModes[build.library]) {
			libraryModes[build.library] = [];
		}
		if (!libraryModes[build.library].includes(build.libraryMode)) {
			libraryModes[build.library].push(build.libraryMode);
		}
	}
	
	const locales = [...new Set(builds.map((build) => build.locales))].sort(
		(a, b) => a - b
	);
	const messages = [...new Set(builds.map((build) => build.messages))].sort(
		(a, b) => a - b
	);
	const namespaceSizes = [
		...new Set(builds.map((build) => build.namespaceSize)),
	]
		.filter((size): size is number => size !== undefined && size !== null)
		.sort((a, b) => a - b);

	const port = 8110;

	const server = startServer(port); // Start server

	// Create results object to store benchmark data
	// Structure: locale -> message -> namespaceSize (as string) -> library+mode -> size
	const results: Record<
		number, 
		Record<number, 
			Record<string, 
				Record<string, number>
			>
		>
	> = {};

	// Initialize results structure
	for (const locale of locales) {
		results[locale] = {};
		for (const message of messages) {
			results[locale][message] = {};
			// Use 'default' as the key when namespaceSize is undefined
			for (const namespaceSize of [...namespaceSizes, undefined]) {
				const nsKey = namespaceSize?.toString() || "default";
				results[locale][message][nsKey] = {};
				for (const library of libraries) {
					for (const mode of libraryModes[library]) {
						results[locale][message][nsKey][`${library}-${mode}`] = 0;
					}
				}
			}
		}
	}

	// Run benchmarks and collect results
	const benchmarkPromises: Array<Promise<void>> = [];
	for (const build of builds) {
		const name = buildConfigToString(build);
		const promise = benchmarkBuild(`http://localhost:${port}/${name}`).then(
			(size) => {
				const nsKey = build.namespaceSize?.toString() || "default";
				results[build.locales][build.messages][nsKey][
					`${build.library}-${build.libraryMode}`
				] = size;
			}
		);
		benchmarkPromises.push(promise);
	}

	// Wait for all benchmarks to complete
	await Promise.all(benchmarkPromises);

	server.close();

	// Generate markdown with tables
	let markdownOutput = "# Benchmark Results\n\n";

	// Format library names for display
	const formatLibraryMode = (key: string): string => {
		const [library, mode] = key.split('-');
		if (library === "paraglide") {
			if (mode === "default") return "paraglide";
			if (mode === "experimental-middleware-optimizations") return "paraglide (experimental)";
			return `paraglide (${mode})`;
		}
		if (library === "i18next") {
			if (mode === "http-backend") return "i18next (http)";
			return `i18next (${mode})`;
		}
		return key;
	};

	// Generate CSV data
	let csvData: string[][] = [];

	// Get all library-mode combinations
	const allLibraryModes: string[] = [];
	for (const library of libraries) {
		for (const mode of libraryModes[library]) {
			allLibraryModes.push(`${library}-${mode}`);
		}
	}

	// Sort library modes (i18next first, then paraglide)
	const sortedLibraryModes = [...allLibraryModes].sort((a, b) => {
		if (a.startsWith("paraglide")) return 1; // paraglide comes second
		if (b.startsWith("paraglide")) return -1;
		return a.localeCompare(b);
	});

	// Format for display
	const formattedLibraryModes = sortedLibraryModes.map(formatLibraryMode);

	// Add header row
	csvData.push(["Locales", "Messages", "Namespace Size", ...formattedLibraryModes]);

	// Add data rows
	for (const locale of locales) {
		// Add locale header row (with empty cells for libraries)
		csvData.push([`**${locale}**`, "", "", ...sortedLibraryModes.map(() => "")]);

		// Add message rows for this locale
		for (const message of messages) {
			if (message === 0) continue; // Skip 0 messages
			
			// Group by namespace size
			for (const namespaceSize of [...namespaceSizes, undefined]) {
				const nsKey = namespaceSize?.toString() || "default";
				// For undefined namespace size, use the message count as the namespace size
				const nsDisplayValue = namespaceSize !== undefined ? namespaceSize : message;
				const libraryResults = sortedLibraryModes.map((libraryMode) =>
					formatBytes(results[locale][message][nsKey][libraryMode])
				);
				
				// Only add row if there are results for this configuration
				if (libraryResults.some(result => result !== "0 B")) {
					csvData.push([
						"",
						message.toString(),
						nsDisplayValue.toString(),
						...libraryResults,
					]);
				}
			}
		}
	}

	// Convert CSV data to CSV string
	const csvString = csvData.map((row) => row.join(",")).join("\n");

	// Convert CSV to markdown table
	const markdownTable = csvToMarkdown(csvString, ",", true);

	// Add table to output
	markdownOutput += markdownTable + "\n\n";

	// Write the markdown tables to a file for easy copying
	fs.writeFileSync("benchmark-results.md", markdownOutput);
	console.log("\nResults saved to benchmark-results.md");

	return markdownOutput;
}

runBenchmarks();
