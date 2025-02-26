import { expect, test } from "vitest";
import {
	createProject as typescriptProject,
	ts,
	type ProjectOptions,
} from "@ts-morph/bootstrap";
import { createRuntimeFile } from "./create-runtime.js";
import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "url";
import { defaultCompilerOptions } from "../compiler-options.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const superStrictRuleOutAnyErrorTsSettings: ProjectOptions["compilerOptions"] =
	{
		outDir: "dist",
		declaration: true,
		allowJs: true,
		checkJs: true,
		noImplicitAny: true,
		noUnusedLocals: true,
		noUnusedParameters: true,
		noImplicitReturns: true,
		noImplicitThis: true,
		noUncheckedIndexedAccess: true,
		noPropertyAccessFromIndexSignature: true,
		module: ts.ModuleKind.Node16,
		strict: true,
	};

test("runtime type", async () => {
	const project = await typescriptProject({
		useInMemoryFileSystem: true,
		compilerOptions: superStrictRuleOutAnyErrorTsSettings,
	});

	const jsdocRuntime = createRuntimeFile({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: defaultCompilerOptions,
	}).replace(
		'import * as pathToRegexp from "@inlang/paraglide-js/path-to-regexp";',
		""
	);

	const file = (path: string) => {
		return [path, fs.readFileSync(resolve(__dirname, path), "utf-8")!] as const;
	};

	project.createSourceFile("./runtime.js", jsdocRuntime);
	project.createSourceFile(...file("./type.ts"));
	project.createSourceFile(...file("./ambient.d.ts"));

	// add the imports for the types in the runtime type
	for (const name of fs.readdirSync(__dirname)) {
		if (name.endsWith(".js")) {
			project.createSourceFile(...file(name));
		}
	}

	project.createSourceFile(
		"./test.ts",
		`
    import * as runtime from "./runtime.js"
    import type { Runtime } from "./type.js"

    runtime satisfies Runtime

		// getLocale() should return type should be a union of language tags, not a generic string
    runtime.getLocale() satisfies "de" | "en" | "en-US"

    // locales should have a narrow type, not a generic string
    runtime.locales satisfies Readonly<Array<"de" | "en" | "en-US">>

    // setLocale() should fail if the given language tag is not included in locales
    // @ts-expect-error - invalid locale
    runtime.setLocale("fr")

    // setLocale() should not fail if the given language tag is included in locales
    runtime.setLocale("de")

		// isLocale should narrow the type of it's argument
		const thing = 5;

		let a: "de" | "en" | "en-US";

		if(runtime.isLocale(thing)) {
			a = thing
		} else {
			// @ts-expect-error - thing is not a language tag
			a = thing
		}

		// to make ts not complain about unused variables
		console.log(a)
    `
	);

	const program = project.createProgram();
	const diagnostics = ts
		.getPreEmitDiagnostics(program)
		// ignore 'export' modifier cannot be applied to ambient modules and module augmentations since they are always visible. /ambient.d.ts
		.filter((d) => d.code !== 2668)
		.filter((d) => d.messageText.toString().includes("path-to-regexp"));
	for (const diagnostic of diagnostics) {
		console.error(diagnostic.messageText, diagnostic.file?.fileName);
	}
	expect(diagnostics.length).toEqual(0);
});
