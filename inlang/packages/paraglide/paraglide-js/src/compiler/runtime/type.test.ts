import { expect, test } from "vitest";
import { createProject as typescriptProject, ts } from "@ts-morph/bootstrap";
import { createRuntime } from "./create-runtime.js";
import fs from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "url";

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

	const jsdocRuntime = createRuntime(
		{ baseLocale: "en", locales: ["en"] },
		false
	);

	const runtimeType = await fs.readFile(
		resolve(__dirname, "./type.ts"),
		"utf-8"
	);

	project.createSourceFile("./runtime.js", jsdocRuntime);

	project.createSourceFile("./runtime-type.ts", runtimeType);

	project.createSourceFile(
		"./test.ts",
		`
    import * as runtime from "./runtime.js"
    import type { Runtime as RuntimeType } from "./runtime-type.js"

    const runtimeType: RuntimeType = runtime
    `
	);

	const program = project.createProgram();
	const diagnostics = ts.getPreEmitDiagnostics(program);
	for (const diagnostic of diagnostics) {
		console.error(diagnostic.messageText, diagnostic.file?.fileName);
	}
	expect(diagnostics.length).toEqual(0);
});
