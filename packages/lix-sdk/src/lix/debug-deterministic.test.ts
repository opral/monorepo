import { expect, test } from "vitest";
import { openLix } from "./open-lix.js";
import { newLixFile } from "./new-lix.js";

test("newLixFile with deterministic mode should produce identical results", async () => {
	// Create two new lix files with the same deterministic settings
	const blob1 = await newLixFile({
		keyValues: [
			{ key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" }
		]
	});
	
	const blob2 = await newLixFile({
		keyValues: [
			{ key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" }
		]
	});
	
	// Open both and compare states
	const lix1 = await openLix({ blob: blob1 });
	const lix2 = await openLix({ blob: blob2 });
	
	const state1 = await lix1.db.selectFrom("state_all").selectAll().execute();
	const state2 = await lix2.db.selectFrom("state_all").selectAll().execute();
	
	// Sort for comparison
	const sortState = (state: any[]) => {
		return [...state].sort((a, b) => {
			const keyA = `${a.schema_key}-${a.entity_id}-${a.file_id}`;
			const keyB = `${b.schema_key}-${b.entity_id}-${b.file_id}`;
			return keyA.localeCompare(keyB);
		});
	};
	
	const sorted1 = sortState(state1);
	const sorted2 = sortState(state2);
	
	// States should be identical
	expect(sorted1.length).toBe(sorted2.length);
	expect(JSON.stringify(sorted1)).toBe(JSON.stringify(sorted2));
});

test("openLix with deterministic mode but no blob", async () => {
	// The issue: when openLix is called without a blob, it creates one internally
	// but doesn't pass the keyValues to newLixFile
	
	const lix1 = await openLix({
		keyValues: [
			{ key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" }
		]
	});
	
	const lix2 = await openLix({
		keyValues: [
			{ key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" }
		]
	});
	
	// Check what's in the key_value table
	const kv1 = await lix1.db.selectFrom("key_value_all").selectAll().execute();
	const kv2 = await lix2.db.selectFrom("key_value_all").selectAll().execute();
	
	console.log("KeyValues in lix1:", kv1.map(kv => ({ key: kv.key, value: kv.value, version: kv.lixcol_version_id })));
	console.log("KeyValues in lix2:", kv2.map(kv => ({ key: kv.key, value: kv.value, version: kv.lixcol_version_id })));
	
	// Check accounts
	const accounts1 = await lix1.db.selectFrom("account").selectAll().execute();
	const accounts2 = await lix2.db.selectFrom("account").selectAll().execute();
	
	console.log("Accounts in lix1:", accounts1);
	console.log("Accounts in lix2:", accounts2);
});