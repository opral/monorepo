import { test, expect } from "vitest";
import { generateHumanId } from "./generate-human-id.js";
import { openLix } from "../lix/open-lix.js";

test("returns deterministic names in deterministic mode", async () => {
	// Open two separate lix instances with deterministic mode
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});
	const lix2 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	// Generate IDs from both instances - they should match
	const id1_lix1 = generateHumanId({ lix: lix1 });
	const id1_lix2 = generateHumanId({ lix: lix2 });
	
	const id2_lix1 = generateHumanId({ lix: lix1 });
	const id2_lix2 = generateHumanId({ lix: lix2 });
	
	const id3_lix1 = generateHumanId({ lix: lix1 });
	const id3_lix2 = generateHumanId({ lix: lix2 });

	// Both instances should generate the same sequence
	expect(id1_lix1).toBe(id1_lix2);
	expect(id2_lix1).toBe(id2_lix2);
	expect(id3_lix1).toBe(id3_lix2);
});

test("cycles through names when exceeding array length", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	// Generate many IDs to test cycling
	const names: string[] = [];
	for (let i = 0; i < 45; i++) {
		names.push(generateHumanId({ lix }));
	}

	// Find where the cycle starts repeating
	let firstRepeatIndex = -1;
	for (let i = 1; i < names.length; i++) {
		if (names[i] === names[0]) {
			firstRepeatIndex = i;
			break;
		}
	}
	
	// Should cycle after 40 names
	expect(firstRepeatIndex).toBe(40);
	
	// Verify cycling pattern
	expect(names[40]).toBe(names[0]);
	expect(names[41]).toBe(names[1]);
	expect(names[42]).toBe(names[2]);
});

test("returns non-deterministic names in normal mode", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: false } }],
	});

	const id1 = generateHumanId({ lix });
	const id2 = generateHumanId({ lix });

	// Names should be strings
	expect(typeof id1).toBe("string");
	expect(typeof id2).toBe("string");

	// Names should not be empty
	expect(id1.length).toBeGreaterThan(0);
	expect(id2.length).toBeGreaterThan(0);

	// Names should be capitalized
	expect(id1[0]).toBe(id1[0]?.toUpperCase());
	expect(id2[0]).toBe(id2[0]?.toUpperCase());
});

test("uses custom separator when provided", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: false } }],
	});

	const idWithDash = generateHumanId({ lix, separator: "-" });
	const idWithSpace = generateHumanId({ lix, separator: " " });
	const idWithUnderscore = generateHumanId({ lix, separator: "_" });

	// All should be strings
	expect(typeof idWithDash).toBe("string");
	expect(typeof idWithSpace).toBe("string");
	expect(typeof idWithUnderscore).toBe("string");

	// Should not contain separators (since we extract only first word)
	expect(idWithDash).not.toContain("-");
	expect(idWithSpace).not.toContain(" ");
	expect(idWithUnderscore).not.toContain("_");
});

test("persists sequence across lix instances", async () => {
	// Create first lix instance
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	// Generate some IDs
	const id1 = generateHumanId({ lix: lix1 });
	const id2 = generateHumanId({ lix: lix1 });
	const id3 = generateHumanId({ lix: lix1 });

	// Get the blob
	const blob = await lix1.toBlob();

	// Create new lix instance from blob
	const lix2 = await openLix({
		blob,
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	// Generate next ID - should continue from where we left off
	const id4 = generateHumanId({ lix: lix2 });
	
	// Verify it's not repeating the sequence
	expect(id4).not.toBe(id1);
	expect(id4).not.toBe(id2);
	expect(id4).not.toBe(id3);
});

test("handles capitalize option", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	// Generate IDs with different capitalize options
	const capitalizedId = generateHumanId({ lix, capitalize: true });
	const lowercaseId = generateHumanId({ lix, capitalize: false });

	// Capitalized should be uppercase first letter
	expect(capitalizedId[0]).toBe(capitalizedId[0]?.toUpperCase());
	
	// Lowercase should be all lowercase
	expect(lowercaseId).toBe(lowercaseId.toLowerCase());
});

test("default capitalize is true", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const id = generateHumanId({ lix });
	
	// Should be capitalized by default
	expect(id[0]).toBe(id[0]?.toUpperCase());
});
