import { type UserConfig } from "vite";

export const builds: BuildConfig[] = createBuildConfigs([
	{
		libraries: ["paraglide", "i18next"],
		locales: 2,
		messages: 200,
		modes: ["spa"],
		percentDynamic: 20,
	},
]);

export function createViteConfig(args: {
	outdir: string;
	mode: string;
	library: string;
	base: string;
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
			modulePreload: false,
		},
		define: {
			// using process.env to make ssg build work
			"process.env.BASE": JSON.stringify(args.base),
			"process.env.MODE": JSON.stringify(args.mode),
			"process.env.LIBRARY": JSON.stringify(args.library),
			"process.env.GENERATE_ABOUT_PAGE": JSON.stringify(args.generateAboutPage),
			"process.env.IS_CLIENT": JSON.stringify("true"),
		},
	};
}

export function createBuildConfigs(
	configs: Array<{
		libraries: Array<BuildConfig["library"]>;
		locales: number;
		messages: number;
		modes: Array<BuildConfig["mode"]>;
		percentDynamic: number;
		generateAboutPage?: boolean;
	}>
): BuildConfig[] {
	const builds = [];
	for (const config of configs) {
		for (const library of config.libraries) {
			for (const mode of config.modes) {
				builds.push({
					library,
					locales: config.locales,
					messages: config.messages,
					percentDynamic: config.percentDynamic,
					mode,
					generateAboutPage: config.generateAboutPage ?? false,
				});
			}
		}
	}
	return builds;
}

type BuildConfig = {
	locales: number;
	messages: number;
	percentDynamic: number;
	mode: "spa" | "ssg";
	library: "paraglide" | "i18next";
	/**
	 * Mainly useful for testing routing.
	 */
	generateAboutPage: boolean;
};