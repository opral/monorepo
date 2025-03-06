import { type UserConfig } from "vite";

/**
 * The total number of messages in the namespace.
 * This can be larger than the number of messages rendered on the page.
 * If not specified, it defaults to the same value as messages.
 */
export const builds: BuildConfig[] = [
	...createBuildMatrix({
		libraries: ["i18next", "paraglide"],
		locales: [2, 5, 10, 20],
		messages: [100, 200, 300],
		modes: ["spa-on-demand", "spa-bundled"],
		percentDynamic: 20,
		namespaceFactor: [2, 5, 10],
	}),
];

export function createViteConfig(args: {
	outdir: string;
	mode: string;
	library: string;
	base: string;
	buildName: string;
	generateAboutPage: boolean;
}): UserConfig {
	return {
		logLevel: "error",
		base: args.base,
		build: {
			outDir: args.outdir,
			minify: false,
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
			"process.env.GENERATE_ABOUT_PAGE": JSON.stringify(args.generateAboutPage),
			"process.env.IS_CLIENT": JSON.stringify("true"),
		},
	};
}

export function createBuildMatrix(config: {
	libraries: Array<BuildConfig["library"]>;
	locales: Array<number>;
	messages: Array<number>;
	modes: Array<BuildConfig["mode"]>;
	percentDynamic: number;
	generateAboutPage?: boolean;
	namespaceFactor?: Array<number>; // New parameter replacing namespaceSizes
}): BuildConfig[] {
	const builds = [];
	for (const library of config.libraries) {
		for (const mode of config.modes) {
			for (const locale of config.locales) {
				for (const message of config.messages) {
					if (config.namespaceFactor && config.namespaceFactor.length > 0) {
						// Create builds with different namespace sizes based on factors
						for (const factor of config.namespaceFactor) {
							const namespaceSize = message * factor;
							builds.push({
								library,
								locales: locale,
								messages: message,
								namespaceSize,
								percentDynamic: config.percentDynamic,
								mode,
								generateAboutPage: config.generateAboutPage ?? false,
							});
						}
					} else {
						// Default behavior - namespace size equals message count
						builds.push({
							library,
							locales: locale,
							messages: message,
							percentDynamic: config.percentDynamic,
							mode,
							generateAboutPage: config.generateAboutPage ?? false,
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
	mode: "spa-bundled" | "spa-on-demand" | "ssg";
	library: "paraglide" | "i18next";
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
	const namespaceStr =
		config.namespaceSize && config.namespaceSize !== config.messages
			? `-ns${config.namespaceSize}`
			: "";
	return `l${config.locales}-m${config.messages}${namespaceStr}-d${config.percentDynamic}-${config.mode}-${config.library}`;
}

export function buildConfigFromString(str: string): BuildConfig {
	const parts = str.split("-");
	let locales, messages, namespaceSize, percentDynamic, mode, library;

	// Extract parts based on prefix
	for (const part of parts) {
		if (part.startsWith("l")) locales = Number(part.substring(1));
		else if (part.startsWith("m")) messages = Number(part.substring(1));
		else if (part.startsWith("ns")) namespaceSize = Number(part.substring(2));
		else if (part.startsWith("d")) percentDynamic = Number(part.substring(1));
		else if (
			part === "spa-bundled" ||
			part === "spa-on-demand" ||
			part === "ssg"
		)
			mode = part;
		else if (part === "paraglide" || part === "i18next") library = part;
	}

	return {
		locales: locales!,
		messages: messages!,
		namespaceSize,
		percentDynamic: percentDynamic!,
		mode: mode! as BuildConfig["mode"],
		library: library as BuildConfig["library"],
		generateAboutPage: false,
	};
}