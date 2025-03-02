import { build } from "vite";
import fs from "node:fs/promises";
import { normalize } from "node:path";
import { createViteConfig } from "./build.config.ts";
import { render as ssrRender } from "./src/entry-server.ts";

const staticPaths = ["/", "/about"];

const builds = [
	{
		library: "paraglide",
		locales: 5,
		messages: 100,
		mode: "ssg",
	},
	{
		library: "paraglide",
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

	// generate pages

	await generatePage({
		path: "/",
		messageKeyStart: 0,
		messageKeyEnd: b.messages,
		library: b.library,
	});

	await generatePage({
		path: "/about",
		messageKeyStart: b.messages,
		messageKeyEnd: b.messages * 2,
		library: b.library,
	});

	// client side build
	await build(
		createViteConfig({ outdir, base, mode: b.mode, library: b.library })
	);

	// server side build
	if (b.mode === "ssg") {
		process.env.BASE = base;
		process.env.MODE = b.mode;
		process.env.LIBRARY = b.library;
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

async function generatePage(args: {
	path: string;
	messageKeyStart: number;
	messageKeyEnd: number;
	library: string;
}) {
	// import library specific expressions
	const { refMessage, importExpression } = await import(
		`./src/i18n/${args.library}.ts`
	);

	let paragraphs: string[] = [];

	for (let i = args.messageKeyStart; i < args.messageKeyEnd; i++) {
		paragraphs.push(`<p>${refMessage(`message${i}`)}</p>`);
	}

	const basePath = args.path === "/" ? "../" : "../../";
	const page = `${importExpression.replace("<src>", basePath)}

	export function Page(): string {
	  return \`
			${paragraphs.join("\n")}
	  \`;
 };
`;
	await fs.writeFile(`./src/pages${args.path}.ts`, page);
}
