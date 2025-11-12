import { describe, expect, test } from "vitest";
import type { Change, DetectedChange, LixFile, LixPlugin } from "@lix-js/sdk";
import { detectChanges } from "./detect-changes.js";
import { applyChanges } from "./apply-changes.js";
import { JSONPointerValueSchema } from "./schemas/json-pointer-value.js";
import {
	pointerFromSegments,
	removeValueAtPointer,
	setValueAtPointer,
	type JSONValue,
} from "./utilities/json-pointer.js";

type DetectArgs = Parameters<NonNullable<LixPlugin["detectChanges"]>>[0];
type ApplyArgs = Parameters<NonNullable<LixPlugin["applyChanges"]>>[0];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const noopQuerySync = (() => {
	throw new Error("querySync is not available in tests");
}) as DetectArgs["querySync"];

const now = () => new Date().toISOString();

const createFile = (data?: Uint8Array) =>
	({
		id: "json-plugin-e2e",
		path: "/plugin-json-e2e.json",
		directory_id: null,
		name: "plugin-json-e2e.json",
		extension: "json",
		metadata: {},
		lixcol_metadata: {},
		hidden: false,
		lixcol_inherited_from_version_id: null,
		lixcol_created_at: now(),
		lixcol_updated_at: now(),
		data,
	}) as LixFile;

const encodeJSON = (value: unknown): Uint8Array =>
	encoder.encode(JSON.stringify(value));

const decodeJSON = (data: Uint8Array | undefined) =>
	data ? JSON.parse(decoder.decode(data)) : undefined;

const convertChanges = (detected: DetectedChange[]): Change[] =>
	detected.map((change, index) => ({
		id: `change-${index}`,
		entity_id: change.entity_id,
		schema_key: change.schema["x-lix-key"],
		schema_version: change.schema["x-lix-version"],
		snapshot_content: change.snapshot_content,
		created_at: now(),
		file_id: "json-plugin-e2e",
		plugin_key: "plugin_json",
		metadata: null,
	}));

const runDetect = (beforeValue: unknown | undefined, afterValue: unknown) =>
	detectChanges({
		before:
			beforeValue === undefined
				? undefined
				: (createFile(encodeJSON(beforeValue)) as DetectArgs["before"]),
		after: createFile(encodeJSON(afterValue)),
		querySync: noopQuerySync,
	});

const runApply = (
	beforeValue: unknown | undefined,
	detected: DetectedChange[],
) =>
	applyChanges({
		file: {
			...(createFile(
				beforeValue === undefined ? undefined : encodeJSON(beforeValue),
			) as ApplyArgs["file"]),
		},
		changes: convertChanges(detected),
	});

const expectRoundTrip = (beforeValue: unknown, afterValue: unknown) => {
	const detected = runDetect(beforeValue, afterValue);
	const { fileData } = runApply(beforeValue, detected);
	expect(decodeJSON(fileData)).toEqual(afterValue);
};

const mulberry32 = (seed: number) => () => {
	seed |= 0;
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const randomPrimitive = (rand: () => number): JSONValue => {
	const roll = rand();
	if (roll < 0.25) return null;
	if (roll < 0.5) return rand() < 0.5;
	if (roll < 0.75) return Math.floor(rand() * 1000);
	return rand().toString(36).slice(2);
};

const randomTree = (rand: () => number, depth = 0, maxDepth = 3): JSONValue => {
	if (depth >= maxDepth || rand() < 0.3) {
		return randomPrimitive(rand);
	}

	const entries = Math.floor(rand() * 3) + 1;
	const obj: Record<string, JSONValue> = {};

	for (let i = 0; i < entries; i++) {
		const key = `k${Math.floor(rand() * 100)}`;
		obj[key] = randomTree(rand, depth + 1, maxDepth);
	}

	return obj;
};

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const randomPointer = (rand: () => number): string => {
	const segmentsLength = Math.floor(rand() * 3) + 1;
	const segments: string[] = [];
	for (let i = 0; i < segmentsLength; i++) {
		segments.push(`k${Math.floor(rand() * 100)}`);
	}
	return pointerFromSegments(segments);
};

const collectPointers = (value: JSONValue, path: string[], acc: string[]) => {
	acc.push(pointerFromSegments(path));
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return;
	}
	const record = value as Record<string, JSONValue>;
	for (const key of Object.keys(record)) {
		collectPointers(record[key]!, [...path, key], acc);
	}
};

const mutateRandomly = (value: JSONValue, rand: () => number): JSONValue => {
	let draft: JSONValue = cloneJson(value);
	const operations = Math.floor(rand() * 4) + 1;

	for (let i = 0; i < operations; i++) {
		if (rand() < 0.5) {
			draft = setValueAtPointer(
				draft,
				randomPointer(rand),
				randomTree(rand, 0, 2),
			);
			continue;
		}

		const pointers: string[] = [];
		collectPointers(draft, [], pointers);
		const candidates = pointers.filter((pointer) => pointer.length > 0);
		if (candidates.length === 0) {
			continue;
		}

		const pointer = candidates[Math.floor(rand() * candidates.length)]!;
		const updated = removeValueAtPointer(draft, pointer);
		draft = updated ?? {};
	}

	return draft;
};

describe("plugin-json integration", () => {
	test("round-trip detect/apply produces the target document", () => {
		const scenarios: Array<{ before: unknown; after: unknown }> = [
			{
				before: { name: "Anna", age: 20 },
				after: { name: "Anna", age: 21, city: "Berlin" },
			},
			{
				before: { nested: { value: { deep: true } } },
				after: { nested: "scalar replacement" },
			},
			{
				before: { list: [1, 2, 3] },
				after: {
					list: [
						{ id: "a", value: 1 },
						{ id: "b", value: 2 },
					],
				},
			},
			{
				before: null,
				after: { createdFromNull: true },
			},
		];

		for (const scenario of scenarios) {
			expectRoundTrip(scenario.before, scenario.after);
		}
	});

	test("object-to-scalar transitions delete leaves before inserting the scalar", () => {
		const before = { node: { child: { leaf: 1 } } };
		const after = { node: "scalar" };

		const detected = runDetect(before, after);

		expect(detected.map((change) => change.entity_id)).toEqual([
			"/node/child/leaf",
			"/node",
		]);
		expect(detected[0]!.snapshot_content).toBeNull();
		expect(detected[detected.length - 1]!.snapshot_content?.value).toBe(
			"scalar",
		);
		expectRoundTrip(before, after);
	});

	test("array edits cover atomic replacement and per-index updates", () => {
		const beforeAtomic = { list: ["a", "b", "c"] };
		const afterAtomic = { list: "reset" };

		const atomicChanges = runDetect(beforeAtomic, afterAtomic);
		expect(atomicChanges.map((c) => c.entity_id)).toEqual([
			"/list/0",
			"/list/1",
			"/list/2",
			"/list",
		]);
		expectRoundTrip(beforeAtomic, afterAtomic);

		const beforeIndices = { numbers: [1, 2, 3] };
		const afterIndices = { numbers: [1, 4, 3, 5] };
		const indexChanges = runDetect(beforeIndices, afterIndices);
		expect(indexChanges).toEqual([
			{
				entity_id: "/numbers/1",
				schema: JSONPointerValueSchema,
				snapshot_content: {
					path: "/numbers/1",
					value: 4,
				},
			},
			{
				entity_id: "/numbers/3",
				schema: JSONPointerValueSchema,
				snapshot_content: {
					path: "/numbers/3",
					value: 5,
				},
			},
		]);
		expectRoundTrip(beforeIndices, afterIndices);
	});

	test("path serialization escapes dots, slashes, tildes and unicode", () => {
		const after = {
			"a.b": {
				"c/d": {
					"tilde~": "value",
				},
			},
			"emoji😀": {
				" spaced ": 1,
			},
			"01": {
				"leading~0": true,
			},
		};

		const detected = runDetect({}, after);
		expect(detected.map((change) => change.entity_id)).toEqual([
			"/a.b/c~1d/tilde~0",
			"/emoji😀/ spaced ",
			"/01/leading~00",
		]);
	});

	test("null values differ from snapshot deletions", () => {
		const before = { nullable: "old", removed: "bye" };
		const after = { nullable: null };

		const detected = runDetect(before, after);
		const nullableChange = detected.find((c) => c.entity_id === "/nullable");
		const removedChange = detected.find((c) => c.entity_id === "/removed");

		expect(nullableChange?.snapshot_content?.value).toBeNull();
		expect(removedChange?.snapshot_content).toBeNull();
		expectRoundTrip(before, after);
	});

	test("removing nested branches leaves parent containers intact", () => {
		const before = { root: { keep: {}, drop: { inner: {} } } };
		const after = { root: { keep: {} } };
		expectRoundTrip(before, after);
	});

	test("proto-pollution attempts are rejected", () => {
		const maliciousChanges: Change[] = [
			{
				id: "malicious",
				entity_id: "/__proto__/polluted",
				schema_key: JSONPointerValueSchema["x-lix-key"],
				schema_version: JSONPointerValueSchema["x-lix-version"],
				snapshot_content: {
					path: "/__proto__/polluted",
					value: true,
				},
				created_at: now(),
				file_id: "json-plugin-e2e",
				plugin_key: "plugin_json",
				metadata: null,
			},
		];

		expect(() =>
			applyChanges({
				file: createFile(encodeJSON({})),
				changes: maliciousChanges,
			} as ApplyArgs),
		).toThrow(/unsafe/i);
	});

	test("invalid JSON payloads throw descriptive errors", () => {
		const invalidAfter = createFile(encoder.encode('{"oops"'));
		expect(() =>
			detectChanges({
				before: undefined,
				after: invalidAfter,
				querySync: noopQuerySync,
			}),
		).toThrow(SyntaxError);

		const invalidFile = createFile(encoder.encode('{"oops"'));
		expect(() =>
			applyChanges({
				file: invalidFile as ApplyArgs["file"],
				changes: [],
			}),
		).toThrow(SyntaxError);
	});

	test("handles deeply nested structures without stack issues", () => {
		const buildDeep = (depth: number, leaf: JSONValue): JSONValue => {
			let current: JSONValue = leaf;
			for (let i = depth - 1; i >= 0; i--) {
				current = { [`level-${i}`]: current };
			}
			return current;
		};

		const before = buildDeep(64, "before");
		const after = buildDeep(64, "after");
		expectRoundTrip(before, after);
	});

	test("fuzzed random trees maintain round-trip invariant", () => {
		const rand = mulberry32(42);
		for (let i = 0; i < 20; i++) {
			const before = { root: randomTree(rand, 0, 3) };
			const after = mutateRandomly(before, rand);
			expectRoundTrip(before, after);
		}
	});
});
