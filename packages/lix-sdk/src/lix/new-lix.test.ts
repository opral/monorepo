import { test, expect } from "vitest";
import { newLixFile } from "./new-lix.js";
import { openLixInMemory } from "./open-lix-in-memory.js";

test("newLixFile creates a valid lix that can be reopened", async () => {
	// Create a new lix file
	const blob = await newLixFile();
	expect(blob.size).toBeGreaterThan(0);
	
	// Open the created lix file
	const lix = await openLixInMemory({ blob });
	
	// Try to query the state table to ensure it works
	const result = await lix.db.selectFrom("state").selectAll().execute();
	expect(result).toEqual([]);
});