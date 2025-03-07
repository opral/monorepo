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

	// Create a map of unique library+mode combinations
	const libraryModeMap = new Map<string, string>();
	for (const build of builds) {
		const key = `${build.library}-${build.libraryMode}`;
		const displayName = `${build.library} (${build.libraryMode})`;
		libraryModeMap.set(key, displayName);
	}

	// Create results object to store benchmark data
	// Structure: locale -> message -> namespaceSize (as string) -> libraryModeKey -> size
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
				for (const [libraryModeKey] of libraryModeMap) {
					results[locale][message][nsKey][libraryModeKey] = 0;
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
	let markdownOutput = "";

	// Create a unique set of configurations
	type ConfigKey = string;
	type LibraryResults = Record<string, number>; // library-mode key -> size
	
	// Group results by configuration
	const configResults = new Map<ConfigKey, { 
		locale: number, 
		message: number, 
		namespaceSize: number | undefined,
		results: LibraryResults 
	}>();
	
	// Collect all configurations and their results
	for (const locale of locales) {
		for (const message of messages) {
			for (const namespaceSize of [...namespaceSizes, undefined]) {
				const nsKey = namespaceSize?.toString() || "default";
				const nsValue = namespaceSize !== undefined ? namespaceSize : message;
				
				// Create a unique key for this configuration
				const configKey = `l${locale}-m${message}-ns${nsValue}`;
				
				if (!configResults.has(configKey)) {
					configResults.set(configKey, {
						locale,
						message,
						namespaceSize: nsValue,
						results: {}
					});
				}
				
				// Add library results for this configuration
				const libraryResults = configResults.get(configKey)!.results;
				for (const [key, _] of libraryModeMap) {
					libraryResults[key] = results[locale][message][nsKey][key];
				}
			}
		}
	}
	
	// Sort configurations
	const sortedConfigs = Array.from(configResults.entries())
		.sort((a, b) => {
			// First sort by locale
			if (a[1].locale !== b[1].locale) {
				return a[1].locale - b[1].locale;
			}
			// Then by message count
			if (a[1].message !== b[1].message) {
				return a[1].message - b[1].message;
			}
			// Finally by namespace size
			return (a[1].namespaceSize || 0) - (b[1].namespaceSize || 0);
		});
	
	// Generate a section for each configuration
	let runNumber = 1;
	for (const [configKey, config] of sortedConfigs) {
		// Skip configurations with no results
		const hasResults = Object.values(config.results).some(size => size > 0);
		if (!hasResults) continue;
		
		// Add configuration details as code blocks
		markdownOutput += `\`Locales: ${config.locale}\`  \n`;
		markdownOutput += `\`Messages: ${config.message}\`   \n`;
		markdownOutput += `\`Namespace Size: ${config.namespaceSize}\` \n\n`;
		
		// Create table for this configuration
		let tableData: string[][] = [];
		tableData.push(["Library", "Total Transfer Size"]);
		
		// Sort libraries (paraglide first, then i18next)
		const sortedLibraryEntries = Object.entries(config.results)
			.sort((a, b) => {
				if (a[0].startsWith("paraglide")) return -1; // paraglide comes first
				if (b[0].startsWith("paraglide")) return 1;
				return a[0].localeCompare(b[0]);
			});
		
		// Add library results
		for (const [key, size] of sortedLibraryEntries) {
			if (size === 0) continue; // Skip libraries with no results
			
			const displayName = libraryModeMap.get(key) || key;
			tableData.push([displayName, formatBytes(size)]);
		}
		
		// Convert to CSV format for csvToMarkdown
		const csvData = tableData.map(row => row.join(',')).join('\n');
		
		// Convert to markdown table using csvToMarkdown
		const markdownTable = csvToMarkdown(csvData, ',', true);
		
		markdownOutput += markdownTable + '\n\n';
		runNumber++;
	}

	// Write the markdown tables to a file for easy copying
	fs.writeFileSync("benchmark-results.md", markdownOutput);
	console.log("\nResults saved to benchmark-results.md");

	return markdownOutput;
}

runBenchmarks();
