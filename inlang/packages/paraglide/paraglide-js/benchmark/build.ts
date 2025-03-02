import { build } from "vite";
import fs from "node:fs/promises";
import { normalize } from "node:path";
import { createViteConfig } from "./build.config.ts";
import { render as ssrRender } from "./src/entry-server.ts";

const staticPaths = ["/", "/about"];

const builds = [
	{
		locales: 5,
		messages: 100,
		mode: "ssg",
	},
	{
		locales: 5,
		messages: 100,
		mode: "spa",
	},
];

// Clean the dist directory
await fs.rm("./dist", { recursive: true, force: true });

for (const [i, b] of builds.entries()) {
	console.log(`Build ${i + 1} of ${builds.length}:`);
	console.table([{ Locales: b.locales, Messages: b.messages, Mode: b.mode }]);

	const base = `${b.locales}-${b.messages}-${b.mode}`;
	const outdir = `./dist/${base}`;

	// client side build
	await build(createViteConfig({ outdir, base }));

	// server side build
	if (b.mode === "ssg") {
		process.env.BASE = base;
		const rootHtml = await fs.readFile(`./${outdir}/index.html`, "utf-8");

		for (const path of staticPaths) {
			const { html } = ssrRender(path);
			const outputPath = normalize(`./${outdir}/${path}/index.html`);
			await fs.mkdir(normalize(`./${outdir}/${path}`), { recursive: true });
			await fs.writeFile(
				outputPath,
				rootHtml.replace("<!--app-html-->", html),
				"utf-8"
			);
		}
	}
}