import { newProject } from "@inlang/sdk";
import { expect, test } from "vitest";
import { createParaglide } from "../create-paraglide.js";

test("returns locale from custom strategy which is async", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-header", "baseLocale"],
	});
	class FakeDB {
		db = new Map<string, string>();
		constructor() {
			this.db.set("1", "fr");
		}

		async getUserLocaleById(id: string) {
			return this.db.get(id);
		}
	}

	const db = new FakeDB();
	async function getLocaleFromUserRequest(request?: Request) {
		const userId = request?.headers.get("X-Custom-User-ID") ?? undefined;
		if (!userId) throw Error("No User ID");
		const locale = await db.getUserLocaleById(userId);
		return locale;
	}
	runtime.defineCustomServerStrategy("custom-header", {
		getLocale: async (request) =>
			(await getLocaleFromUserRequest(request)) ?? undefined,
	});

	const request = new Request("http://example.com", {
		headers: {
			"X-Custom-User-ID": "1",
		},
	});

	const locale = await runtime.extractLocaleFromRequestAsync(request);
	expect(locale).toBe("fr");
});

test("falls back to next strategy when custom strategy returns undefined", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["custom-fallback", "baseLocale"],
	});

	runtime.defineCustomServerStrategy("custom-fallback", {
		getLocale: () => undefined,
	});

	const request = new Request("http://example.com");
	const locale = await runtime.extractLocaleFromRequestAsync(request);
	expect(locale).toBe("en"); // Should fall back to baseLocale
});
