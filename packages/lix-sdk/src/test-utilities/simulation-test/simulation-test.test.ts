import { describe, expect, test } from "vitest";
import { simulationTest, type DstSimulation } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";

test("simulation test discovery", () => {});

describe("expectDeterministic validates values across simulations", () => {
	const customSimulation: DstSimulation = {
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
			simulations: ["normal", "custom"],
			customSimulations: [customSimulation],
		}
	);
});

describe("expectDeterministic catches simulation differences", () => {
	const customSimulation: DstSimulation = {
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
			simulations: ["normal", "custom"],
			customSimulations: [customSimulation],
		}
	);
});

describe("deterministic state validation", () => {
	// Testing this with materialized state and the changes the lix has
	// Both need to be exactly the same for all simulations

	let previousState: any | null = null;
	let previousChanges: any | null = null;

	const mockSimulation: DstSimulation = {
		name: "mock-simulation",
		setup: async (lix) => lix,
	};

	simulationTest(
		"every simulation opens the same lix",
		async ({ initialLix }) => {
			const lix = await openLix({ blob: initialLix });

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
			simulations: ["normal", "mock-simulation"],
			customSimulations: [mockSimulation],
		}
	);
});

describe("database operations are deterministic", async () => {
	const mockSimulation: DstSimulation = {
		name: "mock-simulation",
		setup: async (lix) => lix,
	};

	simulationTest(
		"",
		async ({ initialLix, expectDeterministic }) => {
			const lix = await openLix({ blob: initialLix });

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
			simulations: ["normal", "mock-simulation"],
			customSimulations: [mockSimulation],
		}
	);
});