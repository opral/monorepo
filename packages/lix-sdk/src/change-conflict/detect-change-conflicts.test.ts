import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { Change } from "../database/schema.js";
import { detectChangeConflicts } from "./detect-change-conflicts.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";

test("should detect conflicts using plugins", async () => {
	const lix = await openLixInMemory({});

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectConflicts: vi.fn().mockResolvedValue([
			{
				key: "mock-conflict",
				conflictingChangeIds: new Set(["change0", "change1"]),
			},
		]),
	};

	// Mock the plugin.getAll method to return the mock plugin
	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin]);

	const changes = [
		{
			id: "change0",
			entity_id: "entity0",
			file_id: "file0",
			schema_key: "type0",
		},
		{
			id: "change1",
			entity_id: "entity1",
			file_id: "file1",
			schema_key: "type1",
		},
	] as const satisfies Partial<Change>[];

	const detectedConflicts = await detectChangeConflicts({
		lix,
		changes: changes as unknown as Change[],
	});

	expect(detectedConflicts.length).toBe(1);
	expect(detectedConflicts[0]?.key).toBe("mock-conflict");
	expect(detectedConflicts[0]?.conflictingChangeIds).toEqual(
		new Set(["change0", "change1"]),
	);
	expect(mockPlugin.detectConflicts).toHaveBeenCalledWith({
		lix,
		changes,
	});
});

test("should handle no conflicts detected by plugins", async () => {
	const lix = await openLixInMemory({});

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectConflicts: vi.fn().mockResolvedValue([]),
	};

	// Mock the plugin.getAll method to return the mock plugin
	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin]);

	const changes = [
		{
			id: "change0",
			entity_id: "entity0",
			file_id: "file0",
			schema_key: "type0",
		},
		{
			id: "change1",
			entity_id: "entity1",
			file_id: "file1",
			schema_key: "type1",
		},
	] as const satisfies Partial<Change>[];

	const detectedConflicts = await detectChangeConflicts({
		lix,
		changes: changes as unknown as Change[],
	});

	expect(detectedConflicts.length).toBe(0);
	expect(mockPlugin.detectConflicts).toHaveBeenCalledWith({
		lix,
		changes,
	});
});

test("should handle multiple plugins detecting conflicts", async () => {
	const lix = await openLixInMemory({});

	const mockPlugin1: LixPlugin = {
		key: "mock-plugin1",
		detectConflicts: vi.fn().mockResolvedValue([
			{
				key: "mock-conflict1",
				conflictingChangeIds: new Set(["change0", "change1"]),
			},
		]),
	};

	const mockPlugin2: LixPlugin = {
		key: "mock-plugin2",
		detectConflicts: vi.fn().mockResolvedValue([
			{
				key: "mock-conflict2",
				conflictingChangeIds: new Set(["change1", "change2"]),
			},
		]),
	};

	// Mock the plugin.getAll method to return the mock plugins
	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin1, mockPlugin2]);

	const changes = [
		{
			id: "change0",
			entity_id: "entity0",
			file_id: "file0",
			schema_key: "type0",
		},
		{
			id: "change1",
			entity_id: "entity1",
			file_id: "file1",
			schema_key: "type1",
		},
		{
			id: "change2",
			entity_id: "entity2",
			file_id: "file2",
			schema_key: "type2",
		},
	] as const satisfies Partial<Change>[];

	const detectedConflicts = await detectChangeConflicts({
		lix,
		changes: changes as unknown as Change[],
	});

	expect(detectedConflicts.length).toBe(2);
	expect(detectedConflicts[0]?.key).toBe("mock-conflict1");
	expect(detectedConflicts[0]?.conflictingChangeIds).toEqual(
		new Set(["change0", "change1"]),
	);
	expect(detectedConflicts[1]?.key).toBe("mock-conflict2");
	expect(detectedConflicts[1]?.conflictingChangeIds).toEqual(
		new Set(["change1", "change2"]),
	);
	expect(mockPlugin1.detectConflicts).toHaveBeenCalledWith({
		lix,
		changes,
	});
	expect(mockPlugin2.detectConflicts).toHaveBeenCalledWith({
		lix,
		changes,
	});
});

test("it should auto detect diverging entity conflicts", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "plugin1",
				schema_key: "mock",
				file_id: "file0",
				entity_id: "entity0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "plugin1",
				schema_key: "mock",
				file_id: "file0",
				entity_id: "entity0",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				plugin_key: "plugin1",
				file_id: "file0",
				entity_id: "entity0",
				schema_key: "mock",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_edge")
		.values([
			{ parent_id: "change0", child_id: "change1" },
			{ parent_id: "change0", child_id: "change2" },
		])
		.execute();

	const detectedConflicts = await detectChangeConflicts({
		lix,
		changes,
	});

	expect(detectedConflicts.length).toBe(1);
	expect(detectedConflicts[0]?.key).toBe("lix-diverging-entity-conflict");
	expect(detectedConflicts[0]?.conflictingChangeIds).toEqual(
		new Set(["change1", "change2"]),
	);
});
