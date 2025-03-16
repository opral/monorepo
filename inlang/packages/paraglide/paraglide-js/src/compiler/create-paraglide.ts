import type { Runtime } from "./runtime/type.js";
import type { ServerRuntime } from "./server/type.js";
import {
	defaultCompilerOptions,
	type CompilerOptions,
} from "./compiler-options.js";
import { createRuntimeFile } from "./runtime/create-runtime.js";
import { createServerFile } from "./server/create-server-file.js";

/**
 * Creates an in-memory Paraglide module for use in tests and non-bundled environments.
 *
 * @example
 *   const paraglide = await createParaglide({
 *     baseLocale: "en",
 *     locales: ["en", "de"],
 *     compilerOptions,
 *   })
 *
 *   // Access functions
 *   paraglide.localizeUrl("https://example.com", { locale: "de" })
 *   app.use(paraglide.paraglideMiddleware())
 */
export async function createParaglide(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions?: Omit<CompilerOptions, "outdir" | "project" | "fs">;
}): Promise<Runtime & ServerRuntime & { m: Record<string, unknown> }> {
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
		baseLocale: args.baseLocale,
		locales: args.locales,
		compilerOptions: {
			...defaultCompilerOptions,
			...args.compilerOptions,
		},
	})
		// remove the polyfill import statement to avoid module resolution issues
		.replace(`import "@inlang/paraglide-js/urlpattern-polyfill";`, "");

	// remove the runtime import statement to avoid module resolution issues
	const serverSideRuntime = createServerFile({
		compiledBundles: [],
		compilerOptions: {
			experimentalMiddlewareLocaleSplitting:
				args.compilerOptions?.experimentalMiddlewareLocaleSplitting ??
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
					"To use message functions in tests, you need to mock them or " +
					"provide your own implementation. If you need this functionality, " +
					"please file an issue at https://github.com/opral/monorepo/issues"
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
