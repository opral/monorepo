import { test, expect } from "vitest";
import { generateLocaleModules } from "./locale-modules.js";
import type { Bundle, Message, ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { defaultCompilerOptions } from "../compiler-options.js";

test("should emit per locale message files", () => {
	const bundles: CompiledBundleWithMessages[] = [
		{
			bundle: {
				code: 'console.log("bundle code");',
				node: {
					id: "happy_elephant",
				} as unknown as Bundle,
			},
			messages: {
				en: {
					code: 'console.log("message in English");',
					node: {} as unknown as Message,
				},
				de: {
					code: 'console.log("message in German");',
					node: {} as unknown as Message,
				},
			},
		},
	];

	const settings: Pick<ProjectSettings, "locales" | "baseLocale"> = {
		locales: ["en", "de"],
		baseLocale: "en",
	};

	const fallbackMap: Record<string, string | undefined> = {
		en: "de",
		de: "en",
	};

	const output = generateLocaleModules(
		bundles,
		settings,
		fallbackMap,
		defaultCompilerOptions
	);

	expect(output).toHaveProperty("messages.js");
	expect(output).toHaveProperty("messages/en.js");
	expect(output).toHaveProperty("messages/de.js");

	expect(output["messages/en.js"]).toContain(
		`console.log("message in English");`
	);
});

test("the files should include files for each locale, even if there are no messages", () => {
	const bundles: CompiledBundleWithMessages[] = [
		{
			bundle: {
				code: 'console.log("bundle code");',
				node: {
					id: "happy_elephant",
				} as unknown as Bundle,
			},
			messages: {},
		},
	];

	const settings: Pick<ProjectSettings, "locales" | "baseLocale"> = {
		locales: ["en", "de", "fr"],
		baseLocale: "en",
	};

	const fallbackMap: Record<string, string | undefined> = {
		en: "de",
		de: "en",
	};

	const output = generateLocaleModules(
		bundles,
		settings,
		fallbackMap,
		defaultCompilerOptions
	);

	expect(output).toHaveProperty("messages.js");
	expect(output).toHaveProperty("messages/en.js");
	expect(output).toHaveProperty("messages/de.js");
	expect(output).toHaveProperty("messages/fr.js");
});
