import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { nextSequenceNumber } from "./sequence.js";

test("nextSequenceNumber throws error when deterministic mode is false", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: false }],
	});

	expect(() => nextSequenceNumber({ lix })).toThrow(
		"nextSequenceNumber() is available only when lix_deterministic_mode = true"
	);
});

test("nextSequenceNumber throws error when deterministic mode is not set", async () => {
	const lix = await openLix({});

	expect(() => nextSequenceNumber({ lix })).toThrow(
		"nextSequenceNumber() is available only when lix_deterministic_mode = true"
	);
});

test("nextSequenceNumber works when deterministic mode is true", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const n1 = nextSequenceNumber({ lix });
	const n2 = nextSequenceNumber({ lix });
	const n3 = nextSequenceNumber({ lix });

	// Should be strictly incrementing by 1
	expect(n2).toBe(n1 + 1);
	expect(n3).toBe(n2 + 1);
	
	// Should be non-negative integers
	expect(n1).toBeGreaterThanOrEqual(0);
	expect(Number.isInteger(n1)).toBe(true);
});

test("nextSequenceNumber persists state across blob operations", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Generate some sequence numbers and record the last one
	const n1 = nextSequenceNumber({ lix: lix1 });
	const n2 = nextSequenceNumber({ lix: lix1 });
	const n3 = nextSequenceNumber({ lix: lix1 });
	
	// Verify they increment properly
	expect(n2).toBe(n1 + 1);
	expect(n3).toBe(n2 + 1);

	// Create a new instance from the blob
	const blob = await lix1.toBlob();
	const lix2 = await openLix({ blob });

	// Should continue from where it left off
	const n4 = nextSequenceNumber({ lix: lix2 });
	const n5 = nextSequenceNumber({ lix: lix2 });
	
	expect(n4).toBe(n3 + 1);
	expect(n5).toBe(n4 + 1);
});

test("independent Lix instances have independent sequences", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const lix2 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Get initial values - they should be the same for both since they started identically
	const lix1_n1 = nextSequenceNumber({ lix: lix1 });
	const lix2_n1 = nextSequenceNumber({ lix: lix2 });
	expect(lix1_n1).toBe(lix2_n1);

	// Both increment independently but maintain the same sequence
	const lix1_n2 = nextSequenceNumber({ lix: lix1 });
	const lix2_n2 = nextSequenceNumber({ lix: lix2 });
	
	expect(lix1_n2).toBe(lix1_n1 + 1);
	expect(lix2_n2).toBe(lix2_n1 + 1);
	expect(lix1_n2).toBe(lix2_n2);
});