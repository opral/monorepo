import { compileBundle, type Resource } from "./compileBundle.js";
import { jsIdentifier } from "../services/codegen/identifier.js";
import { createRuntime } from "./runtime.js";
import { createRegistry, DEFAULT_REGISTRY } from "./registry.js";
import {
	selectBundleNested,
	type InlangProject,
	type ProjectSettings,
} from "@inlang/sdk";
import * as prettier from "prettier";
import { escapeForSingleQuoteString } from "../services/codegen/escape.js";
import { lookup } from "../services/lookup.js";
import { emitDts } from "./emit-dts.js";

export type ParaglideCompilerOptions = {
	/**
	 * Whether to emit d.ts files.
	 *
	 * @default true
	 */
	emitDts?: boolean;
	/**
	 * Whether to emit a .prettierignore file.
	 *
	 * @default true
	 */
	emitPrettierIgnore?: boolean;
	/**
	 * Whether to emit a .gitignore file.
	 *
	 * @default true
	 */
	emitGitIgnore?: boolean;
	/**
	 * The file-structure of the compiled output.
	 *
	 * @default "regular"
	 */
	outputStructure?: "regular" | "message-modules";
};

const defaultCompilerOptions: ParaglideCompilerOptions = {
	outputStructure: "regular",
	emitDts: true,
	emitGitIgnore: true,
	emitPrettierIgnore: true,
};

/**
 * Takes an inlang project and compiles it into a set of files.
 *
 * Use this function for more programmatic control than `compile()`.
 * You can adjust the output structure and get the compiled files as a return value.
 *
 * @example
 *   const output = await compileProject({ project });
 *   await writeOutput('path', output, fs.promises);
 */
export const compileProject = async (args: {
	project: InlangProject;
	options?: ParaglideCompilerOptions;
}): Promise<Record<string, string>> => {
	const optionsWithDefaults = {
		...defaultCompilerOptions,
		...args.options,
	};

	const settings = await args.project.settings.get();
	const bundles = await selectBundleNested(args.project.db).execute();

	//Maps each language to it's fallback
	//If there is no fallback, it will be undefined
	const fallbackMap = getFallbackMap(settings.locales, settings.baseLocale);
	const resources = bundles.map((bundle) =>
		compileBundle({
			bundle,
			fallbackMap,
			registry: DEFAULT_REGISTRY,
		})
	);

	const output =
		optionsWithDefaults.outputStructure === "regular"
			? generateRegularOutput(resources, settings, fallbackMap)
			: generateModuleOutput(resources, settings, fallbackMap);

	if (optionsWithDefaults.emitDts) {
		const dtsFiles = emitDts(output);
		Object.assign(output, dtsFiles);
	}

	if (optionsWithDefaults.emitGitIgnore) {
		output[".gitignore"] = ignoreDirectory;
	}

	if (optionsWithDefaults.emitPrettierIgnore) {
		output[".prettierignore"] = ignoreDirectory;
	}

	return await formatFiles(output);
};

function generateRegularOutput(
	resources: Resource[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>
): Record<string, string> {
	const indexFile = [
		"/* eslint-disable */",
		'import { getLocale } from "./runtime.js"',
		settings.locales
			.map(
				(locale) =>
					`import * as ${jsIdentifier(locale)} from "./messages/${locale}.js"`
			)
			.join("\n"),
		resources.map(({ bundle }) => bundle.code).join("\n"),
	].join("\n");

	const output: Record<string, string> = {
		"runtime.js": createRuntime(settings),
		"registry.js": createRegistry(),
		"messages.js": indexFile,
	};

	// generate message files
	for (const locale of settings.locales) {
		const filename = `messages/${locale}.js`;
		let file = `
/* eslint-disable */ 
/** 
 * This file contains language specific functions for tree-shaking. 
 * 
 *! WARNING: Only import from this file if you want to manually
 *! optimize your bundle. Else, import from the \`messages.js\` file. 
 */
import * as registry from '../registry.js'`;

		for (const resource of resources) {
			const compiledMessage = resource.messages[locale];
			const id = jsIdentifier(resource.bundle.node.id);
			if (!compiledMessage) {
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// use the fall back locale e.g. render the message in English if the German message is missing
					file += `\nexport { ${id} } from "./${fallbackLocale}.js"`;
				} else {
					// no fallback exists, render the bundleId
					file += `\nexport const ${id} = () => '${id}'`;
				}
				continue;
			}

			file += `\n\n${compiledMessage.code}`;
		}

		output[filename] = file;
	}
	return output;
}

function generateModuleOutput(
	resources: Resource[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>
): Record<string, string> {
	const output: Record<string, string> = {
		"runtime.js": createRuntime(settings),
		"registry.js": createRegistry(),
	};

	// index messages
	output["messages.js"] = [
		"/* eslint-disable */",
		...resources.map(
			({ bundle }) => `export * from './messages/index/${bundle.node.id}.js'`
		),
	].join("\n");

	for (const resource of resources) {
		const filename = `messages/index/${resource.bundle.node.id}.js`;
		const code = [
			"/* eslint-disable */",
			"import * as registry from '../../registry.js'",
			settings.locales
				.map(
					(locale) =>
						`import * as ${jsIdentifier(locale)} from "../${locale}.js"`
				)
				.join("\n"),
			"import { languageTag } from '../../runtime.js'",
			"",
			resource.bundle.code,
		].join("\n");
		output[filename] = code;
	}

	// generate locales
	for (const locale of settings.locales) {
		const messageIndexFile = [
			"/* eslint-disable */",
			...resources.map(
				({ bundle }) => `export * from './${locale}/${bundle.node.id}.js'`
			),
		].join("\n");
		output[`messages/${locale}.js`] = messageIndexFile;

		// generate individual message files
		for (const resource of resources) {
			let file = [
				"/* eslint-disable */",
				"import * as registry from '../../registry.js' ",
			].join("\n");

			const compiledMessage = resource.messages[locale];
			const id = jsIdentifier(resource.bundle.node.id);
			if (!compiledMessage) {
				// add fallback
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					file += `\nexport { ${id} } from "../${fallbackLocale}.js"`;
				} else {
					file += `\nexport const ${id} = () => '${escapeForSingleQuoteString(
						resource.bundle.node.id
					)}'`;
				}
			} else {
				file += `\n${compiledMessage.code}`;
			}

			output[`messages/${locale}/${resource.bundle.node.id}.js`] = file;
		}
	}
	return output;
}

async function formatFiles(
	files: Record<string, string>
): Promise<Record<string, string>> {
	const output: Record<string, string> = {};
	const promises: Promise<void>[] = [];

	for (const [key, value] of Object.entries(files)) {
		if (!key.endsWith(".js")) {
			output[key] = value;
			continue;
		}

		promises.push(
			new Promise((resolve, reject) => {
				fmt(value)
					.then((formatted) => {
						output[key] = formatted;
						resolve();
					})
					.catch(reject);
			})
		);
	}

	await Promise.all(promises);
	return output;
}

async function fmt(js: string): Promise<string> {
	return await prettier.format(js, {
		arrowParens: "always",
		singleQuote: true,
		printWidth: 100,
		parser: "babel",
		plugins: ["prettier-plugin-jsdoc"],
	});
}

export function getFallbackMap<T extends string>(
	locales: T[],
	baseLocale: NoInfer<T>
): Record<T, T | undefined> {
	return Object.fromEntries(
		locales.map((lang) => {
			const fallbackLanguage = lookup(lang, {
				locales: locales.filter((l) => l !== lang),
				baseLocale,
			});

			if (lang === fallbackLanguage) return [lang, undefined];
			else return [lang, fallbackLanguage];
		})
	) as Record<T, T | undefined>;
}

const ignoreDirectory = `# ignore everything because the directory is auto-generated by inlang paraglide-js
# for more info visit https://inlang.com/m/gerre34r/paraglide-js
*
`;
