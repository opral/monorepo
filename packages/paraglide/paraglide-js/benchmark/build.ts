import { build } from "vite";
import fs from "node:fs/promises";
import { normalize } from "node:path";
import {
	builds,
	buildConfigToString,
	createViteConfig,
} from "./build.config.ts";
import { compile } from "@inlang/paraglide-js";


export const runBuilds = async () => {
	// Clean the dist directory
	await fs.rm("./dist", { recursive: true, force: true });

	// copy the message translation files in case a libary needs them
	await fs.mkdir("./dist");
	await fs.cp("./messages", "./dist/messages", { recursive: true });

	for (const [i, b] of builds.entries()) {
		console.log(`Build ${i + 1} of ${builds.length}:`);
		console.table([
			{
				Locales: b.locales,
				Messages: b.messages,
				Mode: b.mode,
				Library: b.library,
			},
		]);
		const localeDirs = await fs.readdir("./messages", { withFileTypes: true });

		const mostUpToDateLocales = ["en", "de", "fr", "es", "it", "zh-CN"];
		const locales = localeDirs
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
			.sort((a, b) => {
				const indexA = mostUpToDateLocales.indexOf(a);
				const indexB = mostUpToDateLocales.indexOf(b);
				if (indexA === -1 && indexB === -1) return 0;
				if (indexA === -1) return 1;
				if (indexB === -1) return -1;
				return indexA - indexB;
			})
			.slice(0, b.locales);

		const base = buildConfigToString(b);
		const outdir = `./dist/${base}`;

		// created generated i18n file

		const libFile = await fs.readFile(`./src/i18n/${b.library}.ts`, "utf-8");
		await fs.writeFile(
			`./src/i18n/generated.ts`,
			libFile + "\nexport const locales = " + JSON.stringify(locales) + ";"
		);

		if (b.library === "paraglide") {
			await prepareParaglide({ locales });
		}

		// generate pages

		const staticPaths = ["/"];

		if (b.generateAboutPage) {
			staticPaths.push("/about");
		}

		// take en as source of truth because cal.com uses en as base locale
		const enMessages = JSON.parse(
			await fs.readFile("./messages/en/common.json", "utf-8")
		);
		const keys = Object.keys(enMessages).slice(0, b.messages);

		await generatePage({
			path: "/index.ts",
			keys,
			library: b.library,
		});

		if (b.generateAboutPage) {
			await generatePage({
				path: "/about/index.ts",
				keys,
				library: b.library,
			});
		}

		// client side build
		await build(
			createViteConfig({
				outdir,
				base,
				mode: b.mode,
				library: b.library,
				generateAboutPage: b.generateAboutPage,
			})
		);

		// server side build
		if (b.mode === "ssg") {
			process.env.BASE = base;
			process.env.MODE = b.mode;
			process.env.LIBRARY = b.library;
			process.env.IS_CLIENT = "false";
			const rootHtml = await fs.readFile(`./${outdir}/index.html`, "utf-8");
			const { render: ssrRender } = await import(`./src/entry-server.ts`);

			for (const path of staticPaths) {
				const { html } = await ssrRender(path);
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
};

async function generatePage(args: {
	path: string;
	keys: string[];
	library: string;
}) {
	// import library specific expressions
	const { refMessage, importExpression } = await import(
		`./src/i18n/${args.library}.ts`
	);

	let paragraphs: string[] = [];

	for (const key of args.keys) {
		if (key.endsWith("dynamic")) {
			paragraphs.push(`\`<p>\${${refMessage(key, { name: "Peter" })}}</p>\``);
		} else {
			paragraphs.push(`\`<p>\${${refMessage(key)}}</p>\``);
		}
	}

	const basePath = args.path === "/index.ts" ? ".." : "../..";

	const page = `${importExpression().replace("<src>", basePath)}

export function Page(): string {
	return shuffleArray([
		${paragraphs.join(",\n")}
	]).join("\\n");
};

// shuffle the paragraphs
// to have a visible difference when switching locales
function shuffleArray (array: any[])  {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};
`;
	await fs.mkdir(`src/pages/about`, { recursive: true });
	await fs.writeFile(`./src/pages${args.path}`, page);
}

async function prepareParaglide(args: { locales: string[] }) {
	await fs.mkdir(`./project.inlang`, { recursive: true });
	await fs.writeFile(
		`./project.inlang/settings.json`,
		JSON.stringify(
			{
				baseLocale: "en",
				locales: args.locales,
				modules: [
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@6/dist/index.js",
				],
				"plugin.inlang.i18next": {
					pathPattern: "./messages/{locale}/common.json",
				},
			},
			null,
			2
		)
	);
	await compile({
		project: "./project.inlang",
		outdir: "./src/paraglide",
		outputStructure: "locale-modules",
	});
}
