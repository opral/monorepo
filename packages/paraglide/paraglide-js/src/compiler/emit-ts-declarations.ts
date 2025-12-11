import path from "node:path";

type TypeScript = typeof import("typescript");

/**
 * Generates `.d.ts` files for the compiled Paraglide output using the TypeScript compiler.
 *
 * @param output - The generated compiler output keyed by relative file path.
 * @returns The generated declaration files keyed by relative path.
 *
 * @example
 * const declarations = await emitTsDeclarations(output);
 * // Merge them into the compiler output before writing to disk
 */
export async function emitTsDeclarations(
	output: Record<string, string>
): Promise<Record<string, string>> {
	const ts: TypeScript = await import("typescript");

	const jsEntries = Object.entries(output).filter(([fileName]) =>
		fileName.endsWith(".js")
	);

	if (jsEntries.length === 0) {
		return {};
	}

	const virtualRoot = path.join(process.cwd(), "__paraglide_virtual_output");
	const normalizeFileName = (fileName: string) =>
		path.normalize(
			path.isAbsolute(fileName) ? fileName : path.join(virtualRoot, fileName)
		);

	const files = new Map(
		jsEntries.map(([fileName, content]) => [
			normalizeFileName(fileName),
			content,
		])
	);

	const virtualDirectories = new Set(
		Array.from(files.keys()).flatMap((filePath) => {
			const directories: string[] = [];
			let current = path.dirname(filePath);
			while (current.startsWith(virtualRoot) && current !== virtualRoot) {
				directories.push(current);
				const parent = path.dirname(current);
				if (parent === current) break;
				current = parent;
			}
			return directories;
		})
	);
	// Ensure the virtual root itself is treated as existing
	virtualDirectories.add(virtualRoot);

	const compilerOptions: import("typescript").CompilerOptions = {
		allowJs: true,
		checkJs: true,
		declaration: true,
		emitDeclarationOnly: true,
		esModuleInterop: true,
		lib: ["ESNext", "DOM"],
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		noEmitOnError: false,
		outDir: virtualRoot,
		rootDir: virtualRoot,
		skipLibCheck: true,
		target: ts.ScriptTarget.ESNext,
	};

	const defaultHost = ts.createCompilerHost(compilerOptions, true);
	const declarations: Record<string, string> = {};

	const host: import("typescript").CompilerHost = {
		...defaultHost,
		fileExists: (fileName) => {
			const normalized = normalizeFileName(fileName);
			return files.has(normalized) || defaultHost.fileExists(fileName);
		},
		directoryExists: (directoryName) => {
			const normalized = normalizeFileName(directoryName);
			return (
				virtualDirectories.has(normalized) ||
				defaultHost.directoryExists?.(directoryName) === true
			);
		},
		getDirectories: (directoryName) => {
			const normalized = normalizeFileName(directoryName);
			const children = Array.from(virtualDirectories).filter(
				(dir) => path.dirname(dir) === normalized
			);
			return [
				...(defaultHost.getDirectories?.(directoryName) ?? []),
				...children.map((dir) => path.basename(dir)),
			];
		},
		readFile: (fileName) => {
			const normalized = normalizeFileName(fileName);
			return files.get(normalized) ?? defaultHost.readFile(fileName);
		},
		getSourceFile: (
			fileName,
			languageVersion,
			onError,
			shouldCreateNewFile
		) => {
			const normalized = normalizeFileName(fileName);
			const sourceText = files.get(normalized);
			if (sourceText !== undefined) {
				return ts.createSourceFile(fileName, sourceText, languageVersion, true);
			}
			return defaultHost.getSourceFile(
				fileName,
				languageVersion,
				onError,
				shouldCreateNewFile
			);
		},
		writeFile: (fileName, text) => {
			const relativePath = path
				.relative(virtualRoot, fileName)
				.split(path.sep)
				.join(path.posix.sep);

			if (!relativePath.startsWith("..")) {
				declarations[relativePath] = text;
			}
		},
	};

	const program = ts.createProgram(
		Array.from(files.keys()),
		compilerOptions,
		host
	);

	program.emit(undefined, undefined, undefined, true);

	return declarations;
}
