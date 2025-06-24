import { bench } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "../version/create-version.js";

// pre-eliminary testing for queries.
bench(
	"query leaf state for entity with 100 changes in one version",
	async () => {
		const lix = await openLixInMemory({});

		// Create one version
		const version = await createVersion({
			lix,
			id: "test_version",
			name: "Test Version",
		});

		// Create 100 changes for the same entity in the same version
		for (let i = 0; i < 100; i++) {
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "mock_entity_id",
					version_id: version.id,
					snapshot_content: { value: `data_${i}`, change: i },
					schema_key: "benchmark_schema",
					file_id: "benchmark_file",
					plugin_key: "benchmark_plugin",
					schema_version: "1.0",
				})
				.execute();
		}

		// Benchmark querying the leaf state for this entity (should return the latest change)
		await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "mock_entity_id")
			.where("version_id", "=", version.id)
			.selectAll()
			.execute();
	},
	{ iterations: 5, warmupIterations: 1 }
);
