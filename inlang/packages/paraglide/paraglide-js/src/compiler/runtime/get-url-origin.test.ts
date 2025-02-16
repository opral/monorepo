import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns http://y.com in server environment as placeholder to make dependent apis work", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {},
	});

	expect(runtime.getUrlOrigin()).toBe("http://y.com");
});

test("returns the window.location.origin if available", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {},
	});

	globalThis.window = { location: { origin: "https://example.com" } } as any;

	expect(runtime.getUrlOrigin()).toBe("https://example.com");
});
