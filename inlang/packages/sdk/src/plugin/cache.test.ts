import { test, expect, vi } from "vitest";
import { withCache } from "./cache.js";
import { newLixFile, openLix } from "@lix-js/sdk";
import { sql } from "kysely";

test("it should be network-first", async () => {
	const mockLoader = vi
		.fn()
		.mockResolvedValueOnce("module content 1")
		.mockResolvedValueOnce("module content 2");

	const mockModulePath = "https://mock.com/module.js";

	const lix = await openLix({ blob: await newLixFile() });

	const result1 = await withCache(mockLoader, lix)(mockModulePath);

	expect(mockLoader).toHaveBeenCalledTimes(1);
	expect(result1).toBe("module content 1");

	const cachedPlugins = await lix.db
		.selectFrom("file")
		.selectAll()
		// @ts-expect-error - kysely doesn't know about GLOB
		.where(sql`path GLOB '/cache/plugins/*'`)
		.execute();

	expect(cachedPlugins.length).toBe(1);

	const parsed = new TextDecoder().decode(cachedPlugins[0]!.data);

	expect(parsed).toBe("module content 1");

	const result2 = await withCache(mockLoader, lix)(mockModulePath);

	expect(mockLoader).toHaveBeenCalledTimes(2);
	expect(result2).toBe("module content 2");

	const cachedPlugins2 = await lix.db
		.selectFrom("file")
		.selectAll()
		// @ts-expect-error - kysely doesn't know about GLOB
		.where(sql`path GLOB '/cache/plugins/*'`)
		.execute();

	expect(cachedPlugins2.length).toBe(1);

	const parsed2 = new TextDecoder().decode(cachedPlugins2[0]!.data);

	expect(parsed2).toBe("module content 2");
});

test("it should throw the error from the loader if the cache does not exist", async () => {
	const mockLoader = vi.fn().mockRejectedValueOnce(new Error("Network error"));

	const mockModulePath = "https://mock.com/module.js";

	const lix = await openLix({ blob: await newLixFile() });

	await expect(
		async () => await withCache(mockLoader, lix)(mockModulePath)
	).rejects.toThrowError("Network error");
});

test("it should fallback to the cache if the loader fails", async () => {
	const mockLoader = vi.fn().mockRejectedValueOnce(new Error("Network error"));

	const mockModulePath = "https://mock.com/module.js";
	const mockModuleCachePath = "/cache/plugins/31i1etp0l413h";

	const lix = await openLix({ blob: await newLixFile() });

	await lix.db
		.insertInto("file")
		.values({
			path: mockModuleCachePath,
			data: new TextEncoder().encode("cached module content"),
		})
		.execute();

	const result = await withCache(mockLoader, lix)(mockModulePath);
	expect(result).toBe("cached module content");
});
