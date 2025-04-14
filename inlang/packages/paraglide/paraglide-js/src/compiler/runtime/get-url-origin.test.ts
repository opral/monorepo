import { test, expect } from "vitest";
import { createParaglide } from "../create-paraglide.js";
import { newProject } from "@inlang/sdk";

test("returns a placeholder in server environment as placeholder to make dependent apis work", async () => {
	const runtime = await createParaglide({
		project: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		compilerOptions: {},
	});

	expect(runtime.getUrlOrigin()).toBeDefined();
});

test("returns the window.location.origin if available", async () => {
	const runtime = await createParaglide({
		project: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		compilerOptions: {},
	});

	globalThis.window = { location: { origin: "https://example.com" } } as any;

	expect(runtime.getUrlOrigin()).toBe("https://example.com");
});
