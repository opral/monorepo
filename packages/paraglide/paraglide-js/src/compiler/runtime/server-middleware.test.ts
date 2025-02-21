import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("sets the locale and origin", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url", "globalVariable"],
		},
	});

	// setting the global variable to fr to assure that
	runtime.setLocale("fr");

	// simulating multiple requests that could interfere with each other
	await Promise.all([
		runtime.serverMiddleware(
			new Request(new URL("https://example.com/page")),
			() => {
				expect(runtime.getLocale()).toBe("en");
				expect(runtime.getUrlOrigin()).toBe("https://example.com");
			}
		),

		runtime.serverMiddleware(
			new Request(new URL("https://peter.com/de/page")),
			() => {
				expect(runtime.getLocale()).toBe("de");
				expect(runtime.getUrlOrigin()).toBe("https://peter.com");
			}
		),
	]);

	// global variable is not impacted by middleware
	expect(runtime.getLocale()).toBe("fr");
});

test("delocalizes the url if the url strategy is used and returns the locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
		},
	});

	const request = new Request(new URL("https://example.com/de/page"));

	const result: any = await runtime.serverMiddleware(request, (args) => args);

	expect(result.request.url).toBe("https://example.com/page");
	expect(result.locale).toBe("de");
});

test("does not delocalize the url if the url strategy is not used", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable", "baseLocale"],
		},
	});

	const request = new Request(new URL("https://example.com/de/page"));

	const result = await runtime.serverMiddleware(request, (args) => args);

	expect(result.request.url).toBe("https://example.com/de/page");
	// falling back to baseLocale
	expect(result.locale).toBe("en");
});

test("redirects to localized URL when non-URL strategy determines locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:locale/:path(.*)?",
					deLocalizedNamedGroups: { locale: "en" },
					localizedNamedGroups: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});

	// Request to URL in en with cookie specifying French
	const request = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});

	const response = await runtime.serverMiddleware(request, () => {
		// This shouldn't be called since we should redirect
		throw new Error("Should not reach here");
	});

	expect(response instanceof Response).toBe(true);
	expect(response.status).toBe(302); // Redirect status code
	expect(response.headers.get("Location")).toBe(
		"https://example.com/fr/some-path"
	);
});

test("does not redirect if URL already matches determined locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:locale/:path(.*)?",
					deLocalizedNamedGroups: { locale: "en" },
					localizedNamedGroups: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});

	// Request to already localized URL matching cookie locale
	const request = new Request("https://example.com/fr/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});

	let middlewareResolveWasCalled = false;
	await runtime.serverMiddleware(request, () => {
		middlewareResolveWasCalled = true;
	});

	expect(middlewareResolveWasCalled).toBe(true); // Middleware should be called since no redirect needed
});
