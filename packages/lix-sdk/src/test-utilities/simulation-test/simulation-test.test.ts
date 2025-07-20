import { describe, expect, test } from "vitest";
import { simulationTest, type SimulationTestDef } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";
import { commit } from "../../state/commit.js";

test("simulation test discovery", () => {});

describe("expectDeterministic validates values across simulations", () => {
	const customSimulation: SimulationTestDef = {
		name: "custom",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ expectDeterministic }) => {
			// These should be consistent across all simulations

			expect(() => {
				expectDeterministic("same-string").toBe("same-string");
				expectDeterministic(42).toBe(42);
				expectDeterministic({ foo: "bar" }).toEqual({ foo: "bar" });
				expectDeterministic([1, 2, 3]).toEqual([1, 2, 3]);
			}).not.toThrow();
		},
		{
			onlyRun: ["normal"],
			additionalCustomSimulations: [customSimulation],
		}
	);
});

describe("expectDeterministic catches simulation differences", () => {
	const customSimulation: SimulationTestDef = {
		name: "custom",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ simulation, expectDeterministic }) => {
			// This will store different values in different simulations
			const simulationSpecificValue =
				simulation === "normal" ? "normal-value" : "other-value";

			if (simulation === "normal") {
				// This will fail in the second simulation
				expect(() =>
					expectDeterministic(simulationSpecificValue).toBe("normal-value")
				).not.toThrow();
			} else {
				expect(() =>
					expectDeterministic(simulationSpecificValue).toBe("normal-value")
				).toThrow(/SIMULATION DETERMINISM VIOLATION/);
			}
		},
		{
			onlyRun: ["normal"],
			additionalCustomSimulations: [customSimulation],
		}
	);
});

describe("deterministic state validation", () => {
	// Testing this with materialized state and the changes the lix has
	// Both need to be exactly the same for all simulations

	let previousState: any | null = null;
	let previousChanges: any | null = null;

	const mockSimulation: SimulationTestDef = {
		name: "mock-simulation",
		setup: async (lix) => lix,
	};

	simulationTest(
		"every simulation opens the same lix",
		async ({ initialLix, openSimulatedLix }) => {
			const lix = await openSimulatedLix({ blob: initialLix });

			const allState = await lix.db
				.selectFrom("state_all")
				.selectAll()
				.execute();

			const changes = await lix.db.selectFrom("change").selectAll().execute();

			if (previousState === null) {
				previousState = allState;
				previousChanges = changes;
			} else {
				expect(previousState).toEqual(allState);
				expect(previousChanges).toEqual(changes);
			}

			expect(allState).toBeDefined();
		},
		{
			onlyRun: ["normal"],
			additionalCustomSimulations: [mockSimulation],
		}
	);
});

describe("database operations are deterministic", async () => {
	const mockSimulation: SimulationTestDef = {
		name: "mock-simulation",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ initialLix, expectDeterministic, openSimulatedLix }) => {
			const lix = await openSimulatedLix({ blob: initialLix });

			// Testing two types of entity views that exist:
			// 1. Regular entity view (on key_value table)
			// 2. File entity view (whish is a special case because it aggregates multiple entities into one)

			// regular entity view
			await lix.db
				.insertInto("key_value")
				.values({
					key: "test_key",
					value: "test_value",
				})
				.execute();

			// special entity view
			await lix.db
				.insertInto("file")
				.values({
					path: "/test.txt",
					data: new TextEncoder().encode("test content"),
				})
				.execute();

			// Get all tables and views from the database
			const tablesAndViews = lix.sqlite
				.exec({
					sql: `SELECT name FROM sqlite_master 
				WHERE type IN ('table', 'view') 
				AND name NOT LIKE 'sqlite_%'
				ORDER BY name`,
					returnValue: "resultRows",
				})
				.map((row) => row[0] as string);

			// Query each table/view and check determinism
			for (const tableName of tablesAndViews) {
				const data = lix.sqlite.exec({
					sql: `SELECT * FROM "${tableName}"`,
					returnValue: "resultRows",
					columnNames: [],
				});

				try {
					expectDeterministic(data).toBeDefined();
				} catch (error) {
					throw new Error(
						`Determinism check failed for table/view "${tableName}": ${error}`
					);
				}
			}
		},
		{
			onlyRun: ["normal"],
			additionalCustomSimulations: [mockSimulation],
		}
	);
});

describe("providing key values", async () => {
	simulationTest("", async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
				{ key: "test_key_1", value: ["*"], lixcol_version_id: "global" },
			],
		});

		commit({ lix });

		const logLevels = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_key_1")
			.selectAll()
			.execute();

		expect(logLevels).toMatchObject([
			{
				key: "test_key_1",
				value: ["*"],
			},
		]);
	});
});