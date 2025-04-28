import type { Runtime } from "./runtime/type.js";
import type { ServerRuntime } from "./server/type.js";
import {
	defaultCompilerOptions,
	type CompilerOptions,
} from "./compiler-options.js";
import { createRuntimeFile } from "./runtime/create-runtime.js";
import { createServerFile } from "./server/create-server-file.js";
import { loadProjectInMemory } from "@inlang/sdk";

/**
 * Creates an in-memory Paraglide module for use in tests and non-bundled environments.
 *
 * @example
 *	 const blob = await fs.readFile("./project.inlang");
 *   const paraglide = await createParaglide({
 *     blob,
 *     // other options
 *   })
 *
 *   // Access functions
 *   paraglide.localizeUrl("https://example.com", { locale: "de" })
 *   app.use(paraglide.paraglideMiddleware())
 *
 * You can load a project from a directory as well.
 *
 * @example
 *   import { loadProjectFromDirectory } from "@inlang/sdk";
 *
 * 	 const project = await loadProjectFromDirectory("./project");
 *
 *   const paraglide = await createParaglide({
 *     blob: await project.toBlob(),
 *     // other options
 *   })
 *
 *   // Access functions
 *   paraglide.localizeUrl("https://example.com", { locale: "de" })
 *   app.use(paraglide.paraglideMiddleware())
 *
 */
export async function createParaglide(
	args: {
		/**
		 * The inlang file.
		 */
		blob: Blob;
	} & Omit<CompilerOptions, "outdir" | "project" | "fs">
): Promise<Runtime & ServerRuntime & { m: Record<string, unknown> }> {
	// Load the project from the blob
	const project = await loadProjectInMemory({ blob: args.blob });
	const settings = await project.settings.get();

	// Extract baseLocale and locales from the project
	const baseLocale = settings.baseLocale;
	const locales = settings.locales;

	if (!baseLocale) {
		throw new Error("Project must have a baseLocale defined");
	}

	if (!locales || locales.length === 0) {
		throw new Error("Project must have locales defined");
	}

	// Ensure URLPattern is available
	// Note: This is required for URL-based locale strategies
	try {
		// Just test if URLPattern is available
		new URLPattern({ pathname: "/:locale" });
	} catch {
		// Load the polyfill if URLPattern is not available
		await import("urlpattern-polyfill");
	}

	const clientSideRuntime = createRuntimeFile({
		baseLocale,
		locales,
		compilerOptions: {
			...defaultCompilerOptions,
			...args,
		},
	})
		// remove the polyfill import statement to avoid module resolution issues
		.replace(`import "@inlang/paraglide-js/urlpattern-polyfill";`, "");

	// remove the runtime import statement to avoid module resolution issues
	const serverSideRuntime = createServerFile({
		compiledBundles: [],
		compilerOptions: {
			experimentalMiddlewareLocaleSplitting:
				args.experimentalMiddlewareLocaleSplitting ??
				defaultCompilerOptions.experimentalMiddlewareLocaleSplitting,
		},
	})
		.replace(`import * as runtime from "./runtime.js";`, "")
		// the runtime functions are bundled, hence remove the runtime namespace
		.replaceAll("runtime.", "");

	// Add mock message functions that throw helpful errors
	const mockMessageCode = `
	export const m = new Proxy({}, {
		get(target, prop) {
			// Only handle property access, not other operations like 'in' operator
			if (typeof prop === 'string' && prop !== 'then') {
				throw new Error(
					"Message functions are not available in createParaglideModule. " +
					"Upvote and explain your use case in https://github.com/opral/inlang-paraglide-js/issues/471"
				);
			}
			return undefined;
		}
	});`;

	// Combine client and server runtime code with mock messages
	const combinedCode = clientSideRuntime + serverSideRuntime + mockMessageCode;

	// Import the combined code dynamically using the data: protocol
	return await import(
		/* @vite-ignore */
		"data:text/javascript;base64," +
			Buffer.from(combinedCode, "utf-8").toString("base64")
	);
}
