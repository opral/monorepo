import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { populateStateCacheV2 } from "./populate-state-cache.js";
import { timestamp } from "../../deterministic/timestamp.js";

test("trace timestamp calls - cache miss vs cache hit", async () => {
	// Enable timestamp tracing
	process.env.TRACE_TIMESTAMP = "true";
	
	const lix = await openLix({
		keyValues: [
			{ key: "lix_deterministic_mode", value: { enabled: true } },
		],
	});

	// Get the active version
	const [activeVersion] = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.execute();

	console.log("\n\n========================================");
	console.log("SCENARIO 1: CACHE MISS - First access");
	console.log("========================================\n");
	
	// First access - cache miss
	const result1 = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", activeVersion!.id)
		.selectAll()
		.execute();
	
	console.log(`Result 1 count: ${result1.length}`);
	
	console.log("\n\n========================================");
	console.log("SCENARIO 2: CACHE HIT - Second access");
	console.log("========================================\n");
	
	// Second access - should be cache hit
	const result2 = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", activeVersion!.id)
		.selectAll()
		.execute();
	
	console.log(`Result 2 count: ${result2.length}`);
	
	console.log("\n\n========================================");
	console.log("SCENARIO 3: INSERT OPERATION");
	console.log("========================================\n");
	
	// Insert a new key-value pair
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion!.id,
		})
		.execute();
	
	console.log("\n\n========================================");
	console.log("SCENARIO 4: UPDATE OPERATION");
	console.log("========================================\n");
	
	// Update the key-value pair
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "test_key")
		.set({ value: "updated_value" })
		.execute();
	
	console.log("\n\n========================================");
	console.log("SCENARIO 5: DELETE OPERATION");
	console.log("========================================\n");
	
	// Delete the key-value pair
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "test_key")
		.execute();
	
	console.log("\n\n========================================");
	console.log("ANALYSIS COMPLETE");
	console.log("========================================\n");
	
	// Disable tracing
	process.env.TRACE_TIMESTAMP = "false";
	
	expect(true).toBe(true); // Dummy assertion to make test pass
});