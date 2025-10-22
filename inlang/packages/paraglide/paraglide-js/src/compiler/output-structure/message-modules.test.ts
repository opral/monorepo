import { test, expect } from "vitest";
import { generateOutput } from "./message-modules.js";
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

	const output = generateOutput(resources, settings, fallbackMap);

	expect(output).not.toHaveProperty("messages/en.js");
	expect(output).not.toHaveProperty("messages/de.js");
	expect(output).toHaveProperty("messages/happy_elephant.js");
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
		locales: ["en"],
		baseLocale: "en",
	};
	const output = generateOutput(resources, settings, {});

	// expecting only lowercase directories and files
	expect(output).toHaveProperty("messages/happyelephant.js");
        expect(output).toHaveProperty("messages/happyelephant2.js");
        expect(output).not.toHaveProperty("messages/HappyElephant.js");
});

// Regression test for https://github.com/opral/inlang-paraglide-js/issues/507
test("emits fallback definitions after their dependencies", () => {
        const resources: CompiledBundleWithMessages[] = [
                {
                        bundle: {
                                code: "export const admin_tasks = (inputs) => inputs;",
                                node: {
                                        id: "admin_tasks",
                                        declarations: [],
                                } as unknown as Bundle,
                        },
                        messages: {
                                en: {
                                        code: '/** @type {(inputs: {}) => string} */ () => "admin"',
                                        node: {} as unknown as Message,
                                },
                        },
                },
        ];

        const settings: Pick<ProjectSettings, "locales" | "baseLocale"> = {
                locales: ["fr-ca", "fr", "en"],
                baseLocale: "en",
        };

        const fallbackMap: Record<string, string | undefined> = {
                "fr-ca": "fr",
                fr: "en",
                en: undefined,
        };

        const output = generateOutput(resources, settings, fallbackMap);

        const file = output["messages/admin_tasks.js"];

        expect(file).toBeDefined();

        if (!file) {
                throw new Error("messages/admin_tasks.js should have been generated");
        }

        expect(file).toContain("const fr_admin_tasks = en_admin_tasks;");
        expect(file).toContain("const fr_ca_admin_tasks = fr_admin_tasks;");

        const frIndex = file.indexOf("const fr_admin_tasks");
        const frCaIndex = file.indexOf("const fr_ca_admin_tasks");

        expect(frIndex).toBeGreaterThan(-1);
        expect(frCaIndex).toBeGreaterThan(-1);
        expect(frIndex).toBeLessThan(frCaIndex);
});
