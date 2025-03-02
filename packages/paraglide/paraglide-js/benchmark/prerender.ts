import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const toAbsolute = (p: string): string => path.resolve(__dirname, p);

// Create the output directory if it doesn't exist
const outputDir = toAbsolute("dist/static");
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Read the template HTML file
let template: string;
try {
	template = fs.readFileSync(toAbsolute("dist/static/index.html"), "utf-8");
} catch (e) {
	// If the file doesn't exist in dist/static, use the source index.html
	template = fs.readFileSync(toAbsolute("index.html"), "utf-8");
}

// Import the server-side rendering function
const { render } = await import("./src/entry-server.js");

// Define routes to pre-render
// Since we're not using Vue, we'll manually define our routes
const routesToPrerender = ["/", "/about"];

// Pre-render each route
for (const url of routesToPrerender) {
	console.log(`Pre-rendering ${url}...`);

	// No manifest needed
	const [appHtml, preloadLinks] = await render(url);

	const html = template
		.replace(`<!--preload-links-->`, preloadLinks || "")
		.replace(`<!--app-html-->`, appHtml);

	const filePath = `dist/static${url === "/" ? "/index" : url}.html`;

	// Ensure the directory exists
	const dirname = path.dirname(toAbsolute(filePath));
	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}

	fs.writeFileSync(toAbsolute(filePath), html);
	console.log("Pre-rendered:", filePath);
}

console.log("Pre-rendering complete!");
