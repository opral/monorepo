import { chromium } from "playwright";

// Function to benchmark network transfer
async function benchmarkBuild(url: string): Promise<number> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	let totalBytes = 0;
	page.on("response", async (response) => {
		const size = (await response.body()).length; // Get response size in bytes
		totalBytes += size;
	});

	await page.goto(url, { waitUntil: "networkidle" });
	await browser.close();

	return totalBytes / 1024; // Convert to KB
}

// Main execution
const builds = {
	i18next: "http://localhost:3000/1-0-20-spa-i18next",
	paraglide: "http://localhost:3000/1-0-20-spa-paraglide",
};

for (const [name, url] of Object.entries(builds)) {
	benchmarkBuild(url).then((size) => {
		console.log(`${name} build transferred: ${size.toFixed(2)} KB`);
	});
}
