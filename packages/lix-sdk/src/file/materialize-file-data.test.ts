import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { materializeFileData } from "./materialize-file-data.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";

test("materializeFileData with plugin that has changes", async () => {
	const mockPlugin: LixPlugin = {
		key: "test-plugin-2",
		detectChangesGlob: "*.txt",
		detectChanges: () => [],
		applyChanges: ({ changes }) => {
			// Create content based on the changes
			const changeIds = changes.map((c) => c.entity_id).join(",");
			return {
				fileData: new TextEncoder().encode(`processed-${changeIds}`),
			};
		},
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	// Insert a file
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file-2",
			data: new TextEncoder().encode("initial-data"),
			path: "/test.txt",
		})
		.execute();

	// Manually insert some state data to simulate plugin changes
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "entity1",
			schema_key: "test_schema",
			file_id: "test-file-2",
			plugin_key: "test-plugin-2",
			snapshot_content: { value: "test-content" },
			schema_version: "1.0",
			version_id: (
				await lix.db
					.selectFrom("active_version")
					.select("version_id")
					.executeTakeFirstOrThrow()
			).version_id,
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "test-file-2")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Test that materializeFileData processes the changes
	const result = materializeFileData({
		lix,
		file: {
			id: file.id,
			path: file.path,
			lixcol_version_id: file.lixcol_version_id,
			metadata: file.metadata,
		},
	});

	expect(result).toBeInstanceOf(Uint8Array);
	expect(new TextDecoder().decode(result)).toBe("processed-entity1");
});

test("materializeFileData throws when plugin has no applyChanges", async () => {
	const mockPlugin: LixPlugin = {
		key: "test-plugin-no-apply",
		detectChangesGlob: "*.txt",
		detectChanges: () => [],
		// No applyChanges method - this should cause materialization to fail
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	// Insert a file that the plugin will match but cannot materialize
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file-no-apply",
			data: new TextEncoder().encode("initial-data"),
			path: "/test.txt",
			lixcol_version_id: (
				await lix.db
					.selectFrom("active_version")
					.select("version_id")
					.executeTakeFirstOrThrow()
			).version_id,
		})
		.execute();

	// Test that selecting the file throws when plugin cannot materialize
	await expect(
		async () =>
			await lix.db
				.selectFrom("file")
				.where("id", "=", "test-file-no-apply")
				.selectAll()
				.executeTakeFirstOrThrow()
	).rejects.toThrow(
		"[materializeFileData] No changes found for file test-file-no-apply with plugin lix_unknown_file_fallback_plugin. Cannot materialize file data."
	);
});
