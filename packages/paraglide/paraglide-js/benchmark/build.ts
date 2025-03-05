import { build } from "vite";
import fs from "node:fs/promises";
import { normalize } from "node:path";
import { builds, createViteConfig } from "./build.config.ts";
import { compile } from "@inlang/paraglide-js";
import {
	sampleMessages,
	sampleLocales,
	sampleInlangSettings,
} from "./build.samples.ts";

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
			"% Dynamic": b.percentDynamic,
			Mode: b.mode,
			Library: b.library,
		},
	]);
	const locales = sampleLocales.slice(0, b.locales);

	const base = `${b.locales}-${b.messages}-${b.percentDynamic}-${b.mode}-${b.library}`;
	const outdir = `./dist/${base}`;

	const numDynamic = Math.floor((b.percentDynamic / 100) * b.messages);

	// created generated i18n file

	const libFile = await fs.readFile(`./src/i18n/${b.library}.ts`, "utf-8");
	await fs.writeFile(
		`./src/i18n/generated.ts`,
		libFile + "\nexport const locales = " + JSON.stringify(locales) + ";"
	);

	// generate messages
	const keys = await generateMessages({
		locales,
		numMessages: b.messages,
		numDynamic,
	});

	if (b.library === "paraglide") {
		await prepareParaglide({ locales });
	}

	// generate pages

	const staticPaths = ["/"];

	if (b.generateAboutPage) {
		staticPaths.push("/about");
	}

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

/**
 * Generates messages for the given locales.
 *
 * @example
 *   ./
 */
async function generateMessages(args: {
	locales: string[];
	numMessages: number;
	numDynamic: number;
}) {
	let messages: Record<string, string> = {};
	let msgI = 0;
	for (let i = 0; i < args.numMessages; i++) {
		if (i < args.numDynamic) {
			messages[`message${i}dynamic`] = sampleMessages[msgI] + " {{name}}";
		} else {
			messages[`message${i}`] = sampleMessages[msgI];
		}
		msgI++;
		// reset the message index to 0 to
		// loop over the samples again
		if (msgI === 99) {
			msgI = 0;
		}
	}
	for (const locale of args.locales) {
		await fs.mkdir(`./messages`, { recursive: true });
		await fs.writeFile(
			`./messages/${locale}.json`,
			JSON.stringify(messages, null, 2)
		);
	}
	return Object.keys(messages);
}

async function prepareParaglide(args: { locales: string[] }) {
	await fs.mkdir(`./project.inlang`, { recursive: true });
	await fs.writeFile(
		`./project.inlang/settings.json`,
		JSON.stringify(
			{
				...sampleInlangSettings,
				locales: args.locales,
			},
			null,
			2
		)
	);
	await compile({
		project: "./project.inlang",
		outdir: "./src/paraglide",
	});
}
