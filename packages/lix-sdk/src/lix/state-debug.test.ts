import { expect, test } from "vitest";
import { openLix } from "./open-lix.js";
import { newLixFile } from "./new-lix.js";

test("state differences", async () => {
	const lix1 = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: true,
				lixcol_version_id: "global",
			},
		],
	});

	const lix2 = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: true,
				lixcol_version_id: "global",
			},
		],
	});

	const state1 = await lix1.db.selectFrom("state_all").selectAll().execute();
	const state2 = await lix2.db.selectFrom("state_all").selectAll().execute();

	console.log("State 1 count:", state1.length);
	console.log("State 2 count:", state2.length);

	// Group by entity type
	const state1ByType = state1.reduce(
		(acc, s) => {
			acc[s.schema_key] = acc[s.schema_key] || [];
			acc[s.schema_key].push(s);
			return acc;
		},
		{} as Record<string, any[]>
	);

	const state2ByType = state2.reduce(
		(acc, s) => {
			acc[s.schema_key] = acc[s.schema_key] || [];
			acc[s.schema_key].push(s);
			return acc;
		},
		{} as Record<string, any[]>
	);

	console.log(
		"State 1 by type:",
		Object.keys(state1ByType).map((k) => `${k}: ${state1ByType[k].length}`)
	);
	console.log(
		"State 2 by type:",
		Object.keys(state2ByType).map((k) => `${k}: ${state2ByType[k].length}`)
	);

	// Find differences
	const allKeys = new Set([
		...Object.keys(state1ByType),
		...Object.keys(state2ByType),
	]);

	for (const key of allKeys) {
		const s1 = state1ByType[key] || [];
		const s2 = state2ByType[key] || [];

		if (s1.length !== s2.length) {
			console.log(
				`\nDifference in ${key}: state1 has ${s1.length}, state2 has ${s2.length}`
			);

			if (key === "lix_key_value") {
				console.log(
					"State 1 key_values:",
					s1.map((kv) => ({
						key: kv.snapshot_content.key,
						value: kv.snapshot_content.value,
					}))
				);
				console.log(
					"State 2 key_values:",
					s2.map((kv) => ({
						key: kv.snapshot_content.key,
						value: kv.snapshot_content.value,
					}))
				);
			}
		}
	}
	
	// Deep comparison
	console.log("\n=== Deep state comparison ===");
	
	// Sort states for comparison
	const sortState = (state: any[]) => {
		return [...state].sort((a, b) => {
			const keyA = `${a.schema_key}-${a.entity_id}-${a.file_id}`;
			const keyB = `${b.schema_key}-${b.entity_id}-${b.file_id}`;
			return keyA.localeCompare(keyB);
		});
	};
	
	const sorted1 = sortState(state1);
	const sorted2 = sortState(state2);
	
	let differencesFound = false;
	for (let i = 0; i < sorted1.length; i++) {
		const s1 = sorted1[i];
		const s2 = sorted2[i];
		
		if (JSON.stringify(s1) !== JSON.stringify(s2)) {
			console.log(`\nDifference at index ${i}:`);
			console.log("State 1:", s1);
			console.log("State 2:", s2);
			differencesFound = true;
		}
	}
	
	if (!differencesFound) {
		console.log("States are IDENTICAL!");
	} else {
		// Check what's different
		console.log("\n=== Checking ID generation ===");
		const uuid1 = await lix1.sqlite.exec({
			sql: "SELECT lix_uuid_v7() as id",
			returnValue: "resultRows",
		})[0][0];
		
		const uuid2 = await lix2.sqlite.exec({
			sql: "SELECT lix_uuid_v7() as id",
			returnValue: "resultRows",
		})[0][0];
		
		console.log("Next UUID from lix1:", uuid1);
		console.log("Next UUID from lix2:", uuid2);
	}
});

test("debug deterministic mode test", async () => {
	console.log("\n=== Creating lix1 with deterministic mode ===");
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
		blob: await newLixFile(),
	});

	console.log("\n=== Creating lix2 from lix1 blob ===");
	const lix2 = await openLix({
		blob: await lix1.toBlob(),
	});

	// Log initial state
	const initialKv1 = await lix1.db
		.selectFrom("key_value")
		.selectAll()
		.execute();
	const initialKv2 = await lix2.db
		.selectFrom("key_value")
		.selectAll()
		.execute();

	console.log(
		"\nInitial key_values in lix1:",
		initialKv1.map((kv) => ({ key: kv.key, value: kv.value }))
	);
	console.log(
		"Initial key_values in lix2:",
		initialKv2.map((kv) => ({ key: kv.key, value: kv.value }))
	);

	// Check deterministic counter state
	const counter1 = await lix1.db
		.selectFrom("key_value")
		.where("key", "=", "lix_deterministic_counter")
		.selectAll()
		.execute();

	const counter2 = await lix2.db
		.selectFrom("key_value")
		.where("key", "=", "lix_deterministic_counter")
		.selectAll()
		.execute();

	console.log("\nDeterministic counter in lix1:", counter1);
	console.log("Deterministic counter in lix2:", counter2);

	console.log("\n=== Inserting test_key in both ===");
	await lix1.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	await lix2.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	console.log("\n=== Comparing states ===");
	const lix1State = await lix1.db.selectFrom("state").selectAll().execute();
	const lix2State = await lix2.db.selectFrom("state").selectAll().execute();

	console.log("Lix1 state count:", lix1State.length);
	console.log("Lix2 state count:", lix2State.length);

	// Compare specific entities
	const testKeyState1 = lix1State.find((s) => s.entity_id === "test_key");
	const testKeyState2 = lix2State.find((s) => s.entity_id === "test_key");

	console.log("\ntest_key state in lix1:", testKeyState1);
	console.log("test_key state in lix2:", testKeyState2);

	// Check change IDs
	const changes1 = await lix1.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.selectAll()
		.execute();

	const changes2 = await lix2.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.selectAll()
		.execute();

	console.log("\nChanges for test_key in lix1:", changes1);
	console.log("Changes for test_key in lix2:", changes2);

	// Final comparison
	const areEqual = JSON.stringify(lix1State) === JSON.stringify(lix2State);
	console.log("\nStates are equal:", areEqual);

	if (!areEqual) {
		console.log("\nDifferences found - checking ID generation...");

		// Test ID generation
		const uuid1 = lix1.sqlite.exec({
			sql: "SELECT lix_uuid_v7() as id",
			returnValue: "resultRows",
		})[0][0];

		const uuid2 = lix2.sqlite.exec({
			sql: "SELECT lix_uuid_v7() as id",
			returnValue: "resultRows",
		})[0][0];

		console.log("UUID from lix1:", uuid1);
		console.log("UUID from lix2:", uuid2);
	}
});
