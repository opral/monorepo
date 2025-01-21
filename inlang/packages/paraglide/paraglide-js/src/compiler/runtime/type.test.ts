import { expect, test } from "vitest";
import { createProject as typescriptProject, ts } from "@ts-morph/bootstrap";
import { createRuntime } from "./create-runtime.js";
import fs from "node:fs";
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

	const file = (path: string) => {
		return [path, fs.readFileSync(resolve(__dirname, path), "utf-8")!] as const;
	};

	project.createSourceFile("./runtime.js", jsdocRuntime);
	project.createSourceFile(...file("./type.ts"));
	project.createSourceFile(...file("./ambient.d.ts"));
	project.createSourceFile(...file("./get-locale-from-path.js"));
	project.createSourceFile(...file("./is-locale.js"));
	project.createSourceFile(...file("./localized-path.js"));
	project.createSourceFile(...file("./de-localized-path.js"));
	project.createSourceFile(...file("./assert-locale.js"));

	project.createSourceFile(
		"./test.ts",
		`
    import * as runtime from "./runtime.js"
    import type { Runtime } from "./type.js"

    runtime satisfies Runtime
    `
	);

	const program = project.createProgram();
	const diagnostics = ts.getPreEmitDiagnostics(program);
	for (const diagnostic of diagnostics) {
		console.error(diagnostic.messageText, diagnostic.file?.fileName);
	}
	expect(diagnostics.length).toEqual(0);
});
