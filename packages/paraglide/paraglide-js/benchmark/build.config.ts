import { type UserConfig } from "vite";

/**
 * The total number of messages in the namespace.
 * This can be larger than the number of messages rendered on the page.
 * If not specified, it defaults to the same value as messages.
 */
export const builds: BuildConfig[] = [
	// For m=100
	...createBuildMatrix({
		libraries: {
			paraglide: ["default", "experimental-middleware-locale-splitting"],
			i18next: ["default", "http-backend"],
		},
		locales: [5, 10, 20],
		messages: [100],
		percentDynamic: 20,
		namespaceSizes: [100, 200, 500, 1000],
	}),
	// For m=200
	...createBuildMatrix({
		libraries: {
			paraglide: ["default", "experimental-middleware-locale-splitting"],
			i18next: ["default", "http-backend"],
		},
		locales: [5, 10, 20],
		messages: [200],
		percentDynamic: 20,
		namespaceSizes: [200, 500, 1000],
	}),
];

export function createViteConfig(args: {
	outdir: string;
	mode: string;
	library: string;
	libraryMode: string;
	base: string;
	buildName: string;
	generateAboutPage: boolean;
}): UserConfig {
	return {
		logLevel: "error",
		base: args.base,
		build: {
			outDir: args.outdir,
			minify: true,
			target: "es2024",
			// don't load the module preload to keep the bundle free
			// from side effects that could affect the benchmark
			//
			// doesn't work because of https://github.com/vitejs/vite/issues/18551
			modulePreload: false,
		},
		define: {
			// using process.env to make ssg build work
			"process.env.BASE": JSON.stringify(args.base),
			"process.env.MODE": JSON.stringify(args.mode),
			"process.env.BUILD_NAME": JSON.stringify(args.buildName),
			"process.env.LIBRARY": JSON.stringify(args.library),
			"process.env.LIBRARY_MODE": JSON.stringify(args.libraryMode),
			"process.env.GENERATE_ABOUT_PAGE": JSON.stringify(args.generateAboutPage),
			"process.env.IS_CLIENT": JSON.stringify("true"),
		},
	};
}

export function createBuildMatrix(config: {
	libraries: Record<string, string[]>;
	locales: Array<number>;
	messages: Array<number>;
	percentDynamic: number;
	generateAboutPage?: boolean;
	namespaceSizes?: Array<number>;
}): BuildConfig[] {
	const builds = [];

	for (const [library, modes] of Object.entries(config.libraries)) {
		for (const mode of modes) {
			for (const locale of config.locales) {
				for (const message of config.messages) {
					if (config.namespaceSizes && config.namespaceSizes.length > 0) {
						// Create builds with different namespace sizes
						for (const namespaceSize of config.namespaceSizes) {
							// Throw error if namespace size is lower than message count
							if (namespaceSize < message) {
								throw new Error(
									`Namespace size (${namespaceSize}) cannot be lower than message count (${message})`
								);
							}

							builds.push({
								library: library as BuildConfig["library"],
								libraryMode: mode,
								locales: locale,
								messages: message,
								namespaceSize,
								percentDynamic: config.percentDynamic,
								generateAboutPage: config.generateAboutPage ?? true,
							});
						}
					} else {
						// Default behavior - namespace size equals message count
						builds.push({
							library: library as BuildConfig["library"],
							libraryMode: mode,
							locales: locale,
							messages: message,
							percentDynamic: config.percentDynamic,
							generateAboutPage: config.generateAboutPage ?? true,
						});
					}
				}
			}
		}
	}
	return builds;
}

export type BuildConfig = {
	locales: number;
	messages: number;
	percentDynamic: number;
	library: "paraglide" | "i18next";
	/**
	 * The mode for the specific library (e.g., "default", "experimental-", "http-backend")
	 */
	libraryMode: string;
	/**
	 * Mainly useful for testing routing.
	 */
	generateAboutPage: boolean;
	/**
	 * The total number of messages in the namespace.
	 * This can be larger than the number of messages rendered on the page.
	 * If not specified, it defaults to the same value as messages.
	 */
	namespaceSize?: number;
};

export function buildConfigToString(config: BuildConfig): string {
	return `l${config.locales}-m${config.messages}-ns${config.namespaceSize}-d${config.percentDynamic}-${config.library}-${config.libraryMode}`;
}

export function buildConfigFromString(str: string): BuildConfig {
	const parts = str.split("-");
	let locales, messages, namespaceSize, percentDynamic, library, libraryMode;

	// Extract parts based on prefix
	for (const part of parts) {
		if (part.startsWith("l")) locales = Number(part.substring(1));
		else if (part.startsWith("m")) messages = Number(part.substring(1));
		else if (part.startsWith("ns")) namespaceSize = Number(part.substring(2));
		else if (part.startsWith("d")) percentDynamic = Number(part.substring(1));
		else if (part === "paraglide" || part === "i18next") library = part;
		else libraryMode = part;
	}

	return {
		locales: locales!,
		messages: messages!,
		namespaceSize,
		percentDynamic: percentDynamic!,
		library: library as BuildConfig["library"],
		libraryMode: libraryMode!,
		generateAboutPage: true,
	};
}