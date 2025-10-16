import { describe, expect, test } from "vitest";
import { ContextStore } from "./context-store";

describe("ContextStore", () => {
	test("set and get values", () => {
		const store = new ContextStore();
		store.set("active_version", "version-123");
		expect(store.get("active_version")).toBe("version-123");
	});

	test("overwrites existing keys", () => {
		const store = new ContextStore();
		store.set("active_version", "version-123");
		store.set("active_version", "version-456");
		expect(store.get("active_version")).toBe("version-456");
	});

	test("serializes to overlay block", () => {
		const store = new ContextStore();
		store.set("active_version", "version-123");
		store.set("active_file", "/app.tsx");
		const overlay = store.toOverlayBlock();
		expect(overlay).toContain("active_version: version-123");
		expect(overlay).toContain("active_file: /app.tsx");
	});

	test("returns null overlay when empty", () => {
		const store = new ContextStore();
		expect(store.toOverlayBlock()).toBeNull();
	});

	test("clears values", () => {
		const store = new ContextStore();
		store.set("active_version", "version-123");
		store.clear();
		expect(store.get("active_version")).toBeUndefined();
		expect(store.toOverlayBlock()).toBeNull();
	});

	test("delete removes a single key", () => {
		const store = new ContextStore();
		store.set("active_version", "version-123");
		store.set("active_file", "/app.tsx");
		store.delete("active_file");
		expect(store.get("active_file")).toBeUndefined();
		expect(store.get("active_version")).toBe("version-123");
	});
});
