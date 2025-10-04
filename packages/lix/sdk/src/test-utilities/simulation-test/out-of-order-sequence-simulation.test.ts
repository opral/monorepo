import { expect, test } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import { outOfOrderSequenceSimulation } from "./out-of-order-sequence-simulation.js";

test("out-of-order sequence simulation test discovery", () => {});

simulationTest(
	"out-of-order sequence simulation returns non-monotonic sequence numbers",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Get several logical timestamps
		const sequences: number[] = [];
		for (let i = 0; i < 10; i++) {
			sequences.push(Date.parse(await getTimestamp({ lix })));
		}

		// In out-of-order simulation, sequences should not be monotonic
		// We'll check if any sequence is smaller than a previous one
		let foundOutOfOrder = false;
		for (let i = 1; i < sequences.length; i++) {
			if (sequences[i]! < sequences[i - 1]!) {
				foundOutOfOrder = true;
				break;
			}
		}

		expect(foundOutOfOrder).toBe(true);
		expect(sequences).toHaveLength(10);
	},
	{
		simulations: [outOfOrderSequenceSimulation],
	}
);

simulationTest(
	"out-of-order sequence simulation produces correct query results despite shuffled sequences",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Insert data - this creates changes and change sets
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "config_a", value: "a" },
				{ key: "config_b", value: "b" },
				{ key: "config_c", value: "c" },
			])
			.execute();

		// Query state_all - results should be consistent within the out-of-order group
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "!=", "lix_state_cache_stale")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		const allChanges = await lix.db.selectFrom("change").selectAll().execute();

		// Results should be deterministic within the out-of-order group
		expectDeterministic(stateAll).toBeDefined();
		expectDeterministic(allChanges).toBeDefined();
	},
	{
		simulations: [outOfOrderSequenceSimulation],
	}
);
