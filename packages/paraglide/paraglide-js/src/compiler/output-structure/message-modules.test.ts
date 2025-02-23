import { test, expect } from "vitest";
import { generateMessageModules } from "./message-modules.js";
import type { Bundle, Message, ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { defaultCompilerOptions } from "../compiler-options.js";

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

	const output = generateMessageModules(
		resources,
		settings,
		fallbackMap,
		defaultCompilerOptions
	);

	expect(output).not.toHaveProperty("messages/en.js");
	expect(output).not.toHaveProperty("messages/de.js");
	expect(output).toHaveProperty("messages/happy_elephant/en.js");
	expect(output).toHaveProperty("messages/happy_elephant/de.js");
	expect(output).toHaveProperty("messages/happy_elephant/index.js");
});

test("handles case senstivity by creating directories and files only in lowercase", () => {
	const resources: CompiledBundleWithMessages[] = [
		{
			bundle: {
				code: "export const HappyElephant = () => en.HappyElephant",
				node: {
					id: "HappyElephant",
				} as unknown as Bundle,
			},
			messages: {
				en: {
					code: 'export const HappyElephant = () => "HappyElephant0"',
					node: {} as unknown as Message,
				},
			},
		},
		{
			bundle: {
				code: "export const happyelephant = () => en.happyelephant",
				node: {
					id: "happyelephant",
				} as unknown as Bundle,
			},
			messages: {
				en: {
					code: 'export const happyelephant = () => "happyelephant1"',
					node: {} as unknown as Message,
				},
			},
		},
	];
	const settings: Pick<ProjectSettings, "locales" | "baseLocale"> = {
		locales: ["en", "de"],
		baseLocale: "en",
	};
	const output = generateMessageModules(
		resources,
		settings,
		{},
		defaultCompilerOptions
	);

	// expecting only lowercase directories and files
	expect(output).toHaveProperty("messages/happyelephant/en.js");
	expect(output).toHaveProperty("messages/happyelephant/de.js");
	expect(output).toHaveProperty("messages/happyelephant/index.js");
	expect(output).not.toHaveProperty("messages/HappyElephant/en.js");
	expect(output).not.toHaveProperty("messages/HappyElephant/de.js");
	expect(output).not.toHaveProperty("messages/HappyElephant/index.js");

	// expecting both bundles to be merged into the "happyelephant" module
	expect(output["messages/happyelephant/index.js"]).toMatchInlineSnapshot(
		[
			`"export const happyelephant = () => en.happyelephant"`,
			`"export const HappyElephant = () => en.HappyElephant"`,
		].join("\n")
	);
	expect(output["messages/happyelephant/en.js"]).toMatchInlineSnapshot(
		[
			`"export const HappyElephant = () => "HappyElephant0"`,
			`"export const happyelephant = () => "happyelephant1"`,
		].join("\n")
	);
});