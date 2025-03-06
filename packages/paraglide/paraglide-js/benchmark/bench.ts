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

	// Get unique libraries, locales, and messages
	const libraries = [...new Set(builds.map((build) => build.library))];
	const locales = [...new Set(builds.map((build) => build.locales))].sort(
		(a, b) => a - b
	);
	const messages = [...new Set(builds.map((build) => build.messages))].sort(
		(a, b) => a - b
	);

	const port = 8110;

	const server = startServer(port); // Start server

	// Create results object to store benchmark data
	const results: Record<number, Record<number, Record<string, number>>> = {};

	// Initialize results structure
	for (const locale of locales) {
		results[locale] = {};
		for (const message of messages) {
			results[locale][message] = {};
			for (const library of libraries) {
				results[locale][message][library] = 0;
			}
		}
	}

	// Run benchmarks and collect results
	const benchmarkPromises: Array<Promise<void>> = [];
	for (const build of builds) {
		const name = buildConfigToString(build);
		const promise = benchmarkBuild(`http://localhost:${port}/${name}`).then(
			(size) => {
				results[build.locales][build.messages][build.library] = size;
			}
		);
		benchmarkPromises.push(promise);
	}

	// Wait for all benchmarks to complete
	await Promise.all(benchmarkPromises);

	server.close();

	// Generate CSV data for the table
	let csvData: string[][] = [];

	// Add header row
	csvData.push(["Locales", "Messages", ...libraries]);

	// Add data rows
	for (const locale of locales) {
		// Add locale header row (with empty cells for libraries)
		csvData.push([`**${locale}**`, "", ...libraries.map(() => "")]);

		// Add message rows for this locale
		for (const message of messages) {
			if (message === 0) continue; // Skip 0 messages
			const libraryResults = libraries.map((library) =>
				formatBytes(results[locale][message][library])
			);
			csvData.push(["", message.toString(), ...libraryResults]);
		}
	}

	// Convert CSV data to CSV string
	const csvString = csvData.map((row) => row.join(",")).join("\n");

	// Convert CSV to markdown table
	const markdownTable = csvToMarkdown(csvString, ",", true);

	// Write the markdown table to a file for easy copying
	fs.writeFileSync("benchmark-results.md", markdownTable);
	console.log("\nResults saved to benchmark-results.md");

	return markdownTable;
}

runBenchmarks();
