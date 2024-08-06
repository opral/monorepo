import { test, expect, describe } from "vitest";
import { lixPluginV1 } from "./lixPluginV1.js";
import type { Variant } from "../schema/schemaV2.js";
import type { DiffReport } from "@lix-js/sdk";

describe("plugin.diff.variant", () => {
	test("old and neu are the same should not report a diff", async () => {
		const old: Variant = {
			id: "1",
			match: {},
			messageId: "5",
			pattern: [{ type: "text", value: "hello world" }],
		};
		const neu: Variant = {
			id: "1",
			match: {},
			messageId: "5",
			pattern: [{ type: "text", value: "hello world" }],
		};
		const diff = await lixPluginV1.diff.variant({ old, neu });
		expect(diff).toEqual([]);
	});

	test("old and neu are different should yield a diff report", async () => {
		const old: Variant = {
			id: "1",
			match: {},
			messageId: "5",
			pattern: [{ type: "text", value: "hello world" }],
		};
		const neu: Variant = {
			id: "1",
			match: {},
			messageId: "5",
			pattern: [{ type: "text", value: "hello world from Berlin" }],
		};
		const diff = await lixPluginV1.diff.variant({ old, neu });
		expect(diff).toEqual([
			{ type: "variant", value: neu, meta: {} } satisfies DiffReport,
		]);
	});

	test("old is undefined and neu is defined should return a diff report for the new value", async () => {
		const old = undefined;
		const neu: Variant = {
			id: "1",
			match: {},
			messageId: "5",
			pattern: [{ type: "text", value: "hello world" }],
		};
		const diff = await lixPluginV1.diff.variant({ old, neu });
		expect(diff).toEqual([
			{ type: "variant", value: neu, meta: {} } satisfies DiffReport,
		]);
	});
});
