import { expect, test } from "vitest";
import { createProject as typescriptProject, ts } from "@ts-morph/bootstrap";
import { createRuntimeFile } from "./create-runtime.js";
import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "url";
import { defaultCompilerOptions } from "../compile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("runtime type", async () => {
	const project = await typescriptProject({
		useInMemoryFileSystem: true,
		compilerOptions: {
			outDir: "./dist",
			declaration: true,
			allowJs: true,
			checkJs: true,
			module: ts.ModuleKind.Node16,
			strict: true,
		},
	});

	const jsdocRuntime = createRuntimeFile({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: defaultCompilerOptions,
	});

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
    `
	);

	const program = project.createProgram();
	const diagnostics = ts
		.getPreEmitDiagnostics(program)
		// ignore 'export' modifier cannot be applied to ambient modules and module augmentations since they are always visible. /ambient.d.ts
		.filter((d) => d.code !== 2668);
	for (const diagnostic of diagnostics) {
		console.error(diagnostic.messageText, diagnostic.file?.fileName);
	}
	expect(diagnostics.length).toEqual(0);
});
