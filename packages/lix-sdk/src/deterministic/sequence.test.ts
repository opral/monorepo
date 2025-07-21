import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { nextDeterministicSequenceNumber } from "./sequence.js";

test("nextDeterministicSequenceNumber throws error when deterministic mode is false", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: false } }],
	});

	expect(() => nextDeterministicSequenceNumber({ lix })).toThrow(
		"nextDeterministicSequenceNumber() is available only when lix_deterministic_mode = true"
	);
});

test("nextDeterministicSequenceNumber throws error when deterministic mode is not set", async () => {
	const lix = await openLix({});

	expect(() => nextDeterministicSequenceNumber({ lix })).toThrow(
		"nextDeterministicSequenceNumber() is available only when lix_deterministic_mode = true"
	);
});

test("nextDeterministicSequenceNumber works when deterministic mode is true", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const n1 = nextDeterministicSequenceNumber({ lix });
	const n2 = nextDeterministicSequenceNumber({ lix });
	const n3 = nextDeterministicSequenceNumber({ lix });

	// Should be strictly incrementing by 1
	expect(n2).toBe(n1 + 1);
	expect(n3).toBe(n2 + 1);

	// Should be non-negative integers
	expect(n1).toBeGreaterThanOrEqual(0);
	expect(Number.isInteger(n1)).toBe(true);
});

test("nextDeterministicSequenceNumber persists state across blob operations", async () => {
	const lix1 = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	// Generate some sequence numbers and record the last one
	const n1 = nextDeterministicSequenceNumber({ lix: lix1 });
	const n2 = nextDeterministicSequenceNumber({ lix: lix1 });
	const n3 = nextDeterministicSequenceNumber({ lix: lix1 });

	// Verify they increment properly
	expect(n2).toBe(n1 + 1);
	expect(n3).toBe(n2 + 1);

	// Create a new instance from the blob
	const blob = await lix1.toBlob();
	const lix2 = await openLix({ blob });

	// Should continue from where it left off
	const n4 = nextDeterministicSequenceNumber({ lix: lix2 });
	const n5 = nextDeterministicSequenceNumber({ lix: lix2 });

	expect(n4).toBe(n3 + 1);
	expect(n5).toBe(n4 + 1);
});

test("independent Lix instances have independent sequences", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const lix2 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	// Get initial values - they should be the same for both since they started identically
	const lix1_n1 = nextDeterministicSequenceNumber({ lix: lix1 });
	const lix2_n1 = nextDeterministicSequenceNumber({ lix: lix2 });
	expect(lix1_n1).toBe(lix2_n1);

	// Both increment independently but maintain the same sequence
	const lix1_n2 = nextDeterministicSequenceNumber({ lix: lix1 });
	const lix2_n2 = nextDeterministicSequenceNumber({ lix: lix2 });

	expect(lix1_n2).toBe(lix1_n1 + 1);
	expect(lix2_n2).toBe(lix2_n1 + 1);
	expect(lix1_n2).toBe(lix2_n2);
});
