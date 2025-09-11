import { expect, test, vi } from "vitest";
import { createHooks } from "./create-hooks.js";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import type { StateCommitChange } from "./create-hooks.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { withWriterKey } from "../state/writer.js";

test("should create hooks with onStateCommit method", () => {
	const hooks = createHooks();

	expect(hooks.onStateCommit).toBeDefined();
	expect(typeof hooks.onStateCommit).toBe("function");
	expect(hooks._emit).toBeDefined();
	expect(typeof hooks._emit).toBe("function");
});

test("should call handler when state_commit event is emitted", () => {
	const hooks = createHooks();
	const handler = vi.fn();

	hooks.onStateCommit(handler);
	hooks._emit("state_commit");

	expect(handler).toHaveBeenCalledTimes(1);
});

test("should call multiple handlers when state_commit event is emitted", () => {
	const hooks = createHooks();
	const handler1 = vi.fn();
	const handler2 = vi.fn();

	hooks.onStateCommit(handler1);
	hooks.onStateCommit(handler2);
	hooks._emit("state_commit");

	expect(handler1).toHaveBeenCalledTimes(1);
	expect(handler2).toHaveBeenCalledTimes(1);
});

test("should return unsubscribe function that removes the handler", () => {
	const hooks = createHooks();
	const handler = vi.fn();

	const unsubscribe = hooks.onStateCommit(handler);

	// Emit event - handler should be called
	hooks._emit("state_commit");
	expect(handler).toHaveBeenCalledTimes(1);

	// Unsubscribe and emit again - handler should not be called
	unsubscribe();
	hooks._emit("state_commit");
	expect(handler).toHaveBeenCalledTimes(1);
});

test("should handle multiple subscriptions and unsubscriptions correctly", () => {
	const hooks = createHooks();
	const handler1 = vi.fn();
	const handler2 = vi.fn();
	const handler3 = vi.fn();

	const unsubscribe1 = hooks.onStateCommit(handler1);
	const unsubscribe2 = hooks.onStateCommit(handler2);
	const unsubscribe3 = hooks.onStateCommit(handler3);

	// All handlers should be called
	hooks._emit("state_commit");
	expect(handler1).toHaveBeenCalledTimes(1);
	expect(handler2).toHaveBeenCalledTimes(1);
	expect(handler3).toHaveBeenCalledTimes(1);

	// Remove handler2
	unsubscribe2();
	hooks._emit("state_commit");
	expect(handler1).toHaveBeenCalledTimes(2);
	expect(handler2).toHaveBeenCalledTimes(1); // Still 1
	expect(handler3).toHaveBeenCalledTimes(2);

	// Remove handler1 and handler3
	unsubscribe1();
	unsubscribe3();
	hooks._emit("state_commit");
	expect(handler1).toHaveBeenCalledTimes(2); // Still 2
	expect(handler2).toHaveBeenCalledTimes(1); // Still 1
	expect(handler3).toHaveBeenCalledTimes(2); // Still 2
});

test("should not call handlers for different event types", () => {
	const hooks = createHooks();
	const handler = vi.fn();

	hooks.onStateCommit(handler);
	hooks._emit("other_event");

	expect(handler).not.toHaveBeenCalled();
});

test("should handle async handlers without issues", async () => {
	const hooks = createHooks();
	const handler = vi.fn().mockResolvedValue(undefined);

	hooks.onStateCommit(handler);
	hooks._emit("state_commit");

	// Wait a bit to ensure async handler has time to run
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(handler).toHaveBeenCalledTimes(1);
});

test("should create independent hook instances", () => {
	const hooks1 = createHooks();
	const hooks2 = createHooks();
	const handler1 = vi.fn();
	const handler2 = vi.fn();

	hooks1.onStateCommit(handler1);
	hooks2.onStateCommit(handler2);

	// Emit on hooks1 - only handler1 should be called
	hooks1._emit("state_commit");
	expect(handler1).toHaveBeenCalledTimes(1);
	expect(handler2).not.toHaveBeenCalled();

	// Emit on hooks2 - only handler2 should be called
	hooks2._emit("state_commit");
	expect(handler1).toHaveBeenCalledTimes(1);
	expect(handler2).toHaveBeenCalledTimes(1);
});

test("onStateCommit emits state-shaped changes with version_id and commit_id", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const v = await createVersion({ lix, name: "hook-test" });

	const events: StateCommitChange[][] = [];
	const unsubscribe = lix.hooks.onStateCommit(({ changes }) => {
		events.push(changes);
	});

	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "hook-entity",
			schema_key: "mock_entity",
			schema_version: "1.0",
			file_id: "hook-file",
			version_id: v.id,
			plugin_key: "mock-plugin",
			snapshot_content: { id: "hook-entity", name: "Hello" },
		})
		.execute();

	await new Promise((r) => setTimeout(r, 0));

	expect(events.length).toBeGreaterThan(0);
	const flat = events.flat();
	const domain = flat.find(
		(c) => c.schema_key === "mock_entity" && c.entity_id === "hook-entity"
	);
	expect(domain).toBeDefined();
	expect(domain!.version_id).toBe(v.id);
	expect(typeof domain!.commit_id).toBe("string");
	expect((domain!.commit_id ?? "").length).toBeGreaterThan(0);
	expect(domain!.untracked ?? 0).toBe(0);

	unsubscribe();
	await lix.close();
});

test("onStateCommit exposes writer_key for state changes", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema_writer_hook",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: { value: { type: "string" } },
	};
	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	const WRITER = "testapp:hooks#writer";
	const events: any[][] = [];
	const unsubscribe = lix.hooks.onStateCommit(({ changes }) => {
		events.push(changes as any);
	});

	await withWriterKey(lix.db, WRITER, async (trx) => {
		await trx
			.insertInto("state")
			.values({
				entity_id: "w1",
				file_id: "f1",
				schema_key: mockSchema["x-lix-key"],
				schema_version: mockSchema["x-lix-version"],
				plugin_key: "test_plugin",
				snapshot_content: { value: "A" } as any,
			})
			.execute();
	});

	const flat = events.flat();
	const change = flat.find(
		(c: any) =>
			c?.entity_id === "w1" && c?.schema_key === mockSchema["x-lix-key"]
	);
	expect(change).toBeDefined();
	expect(change.writer_key).toBe(WRITER);

	unsubscribe();
	await lix.close();
});
