import { type UserConfig } from "vite";


export const builds: BuildConfig[] = [
	...createBuildMatrix({
		libraries: ["paraglide", "i18next"],
		locales: [2, 5, 10, 20],
		messages: [50, 100, 200],
		modes: ["spa-bundled", "spa-on-demand"],
		percentDynamic: 20,
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
}): BuildConfig[] {
	const builds = [];
	for (const library of config.libraries) {
		for (const mode of config.modes) {
			for (const locale of config.locales) {
				for (const message of config.messages) {
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
};

export function buildConfigToString(config: BuildConfig): string {
	return `l${config.locales}-m${config.messages}-d${config.percentDynamic}-${config.mode}-${config.library}`;
}

export function buildConfigFromString(str: string): BuildConfig {
	const [locales, messages, percentDynamic, mode, library] = str.split("-");
	return {
		locales: Number(locales),
		messages: Number(messages),
		percentDynamic: Number(percentDynamic),
		mode: mode! as BuildConfig["mode"],
		library: library as BuildConfig["library"],
		generateAboutPage: false,
	};
}