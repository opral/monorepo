import { expect, test, vi } from "vitest";
import { createHooks } from "./create-hooks.js";

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
