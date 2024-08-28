import { test, expect, vi } from "vitest";
import { createState } from "./state.js";
import { firstValueFrom } from "rxjs";

test("plugins should be re-imported if the settings have been updated", async () => {
	const mockImportPlugins = vi.hoisted(() =>
		vi.fn().mockImplementation(async (args) => {
			console.log("importing plugins");
			const plugins = args.settings.modules.map((uri: any) => {
				return { key: uri };
			});
			return { plugins, errors: [] };
		})
	);

	vi.mock(import("../../plugin/importPlugins.js"), async (importOriginal) => {
		const mod = await importOriginal();
		return {
			...mod,
			importPlugins: mockImportPlugins,
		};
	});

	const state = await createState({
		settings: {
			baseLocale: "en",
			locales: ["en"],
			modules: [],
		},
	});

	state.plugins$.subscribe(() => {});

	const plugins1 = await firstValueFrom(state.plugins$);

	expect(plugins1).toEqual([]);
	expect(mockImportPlugins).toHaveBeenCalledTimes(1);

	state.settings$.next({
		baseLocale: "en",
		locales: ["en"],
		modules: ["@inlang/plugin-react"],
	});

	const plugins2 = await firstValueFrom(state.plugins$);
	expect(plugins2).toEqual([{ key: "@inlang/plugin-react" }]);
	expect(mockImportPlugins).toHaveBeenCalledTimes(2);

	state.settings$.next({
		baseLocale: "en",
		locales: ["en"],
		modules: ["@inlang/plugin-react"],
	});

	const plugins3 = await firstValueFrom(state.plugins$);
	expect(plugins3).toEqual([{ key: "@inlang/plugin-react" }]);
	expect(mockImportPlugins).toHaveBeenCalledTimes(2);

	state.settings$.next({
		baseLocale: "en",
		locales: ["en"],
		modules: [],
	});

	const plugins4 = await firstValueFrom(state.plugins$);
	// mockSubscription.unsubscribe();

	expect(plugins4).toEqual([]);
	expect(mockImportPlugins).toHaveBeenCalledTimes(3);
});
