import { newProject } from "@inlang/sdk";
import { expect, test } from "vitest";
import { createParaglide } from "../create-paraglide.js";

test("returns the preferred locale from navigator.languages", async () => {
	const originalNavigator = globalThis.navigator;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		isServer: "false",
		strategy: ["preferredLanguage"],
	});

	// Mock navigator.languages
	Object.defineProperty(globalThis, "navigator", {
		value: {
			languages: ["fr-FR", "en-US", "de"],
		},
		configurable: true,
	});

	expect(runtime.getLocale()).toBe("fr");

	// Restore original navigator
	Object.defineProperty(globalThis, "navigator", {
		value: originalNavigator,
		configurable: true,
	});
});
