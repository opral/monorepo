import { expect, test, vi } from "vitest";
import { newProject } from "../project/newProject.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { insertBundleNested } from "./insertBundleNested.js";
import { selectBundleNested } from "./selectBundleNested.js";
import type { NewBundleNested } from "../database/schema.js";

const text = (value: string) => [{ type: "text" as const, value }];

const fixtures: NewBundleNested[] = [
	{
		// inserted first, sorts last
		id: "zeta",
		declarations: [{ type: "input-variable", name: "count" }],
		messages: [
			{
				id: "zeta_en",
				bundle_id: "zeta",
				locale: "en",
				selectors: [{ type: "variable-reference", name: "count" }],
				variants: [
					{
						id: "zeta_en_b",
						message_id: "zeta_en",
						matches: [],
						pattern: text("other"),
					},
					{
						id: "zeta_en_a",
						message_id: "zeta_en",
						matches: [{ type: "literal-match", key: "count", value: "one" }],
						pattern: text("one"),
					},
				],
			},
			{
				id: "zeta_de",
				bundle_id: "zeta",
				locale: "de",
				selectors: [],
				variants: [],
			},
		],
	},
	{ id: "alpha", declarations: [], messages: [] },
	{
		id: "mid",
		declarations: [],
		messages: [
			{
				id: "mid_fr",
				bundle_id: "mid",
				locale: "fr",
				selectors: [],
				variants: [
					{
						id: "mid_fr_one",
						message_id: "mid_fr",
						matches: [],
						pattern: text("Bonjour"),
					},
				],
			},
		],
	},
];

test("selecting all bundles matches the per-bundle joined reads in id order", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	for (const bundle of fixtures) {
		await insertBundleNested(project.db, bundle);
	}

	const all = await selectBundleNested(project.db).execute();

	// bundles, messages, and variants are ordered by id
	expect(all.map((bundle) => bundle.id)).toEqual(["alpha", "mid", "zeta"]);
	expect(all[2]!.messages.map((message) => message.id)).toEqual([
		"zeta_de",
		"zeta_en",
	]);
	expect(all[2]!.messages[1]!.variants.map((variant) => variant.id)).toEqual([
		"zeta_en_a",
		"zeta_en_b",
	]);
	// bundles without messages and messages without variants are kept
	expect(all[0]!.messages).toEqual([]);
	expect(all[2]!.messages[0]!.variants).toEqual([]);

	// the bulk path returns exactly what the single-bundle join returns
	for (const bundle of all) {
		const single = await selectBundleNested(project.db)
			.where("inlang_bundle.id", "=", bundle.id)
			.executeTakeFirstOrThrow();
		expect(bundle).toEqual(single);
	}
	await project.close();
});

test("selecting all bundles reads the three tables from one snapshot", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	for (const bundle of fixtures) {
		await insertBundleNested(project.db, bundle);
	}
	const read = vi.spyOn(project.lix, "read");
	const stream = vi.spyOn(project.lix, "stream");

	const all = await selectBundleNested(project.db).execute();

	expect(read).toHaveBeenCalledTimes(1);
	// The scans go through the snapshot, not the latest state.
	expect(stream).not.toHaveBeenCalled();
	expect(all.map((bundle) => bundle.id)).toEqual(["alpha", "mid", "zeta"]);
	await project.close();
});
