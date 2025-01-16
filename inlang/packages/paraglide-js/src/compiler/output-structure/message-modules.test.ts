import { test, expect } from "vitest";
import { generateMessageModules } from "./message-modules.js";
import type { Bundle, Message, ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";

test("should emit per locale message files", () => {
	const resources: CompiledBundleWithMessages[] = [
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

	const emitTs = false;

	const useTsImports = false;

	const output = generateMessageModules(
		resources,
		settings,
		fallbackMap,
		emitTs,
		useTsImports
	);

	expect(output).not.toHaveProperty("messages/en.js");
	expect(output).not.toHaveProperty("messages/de.js");
	expect(output).toHaveProperty("messages/happy_elephant/en.js");
	expect(output).toHaveProperty("messages/happy_elephant/de.js");
	expect(output).toHaveProperty("messages/happy_elephant/index.js");
});
