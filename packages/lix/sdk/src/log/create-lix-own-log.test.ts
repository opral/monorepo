import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixLog } from "./schema-definition.js";
import { createLixOwnLogSync } from "./create-lix-own-log.js";

test("should insert logs default log levels when lix_log_levels is not set)", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_log_levels", value: ["info", "warn", "error"] }],
	});

	await createLogs(lix);

	const logs = await getLogs(lix);

	expect(logs).toHaveLength(3); // info, warn, error

	expect(logs.find((log) => log.level === "debug")).toBeUndefined();
	expect(logs.find((log) => log.level === "info")?.message).toBe(
		"info message"
	);
	expect(logs.find((log) => log.level === "info")?.payload).toBeNull();
	expect(logs.find((log) => log.level === "warn")?.message).toBe(
		"warn message"
	);
	expect(logs.find((log) => log.level === "warn")?.payload).toEqual({
		reason: "detected",
		path: "/tmp/example.txt",
	});
	expect(logs.find((log) => log.level === "error")?.message).toBe(
		"error message"
	);
	expect(logs.find((log) => log.level === "error")?.payload).toBeNull();
});

test("should insert only specified levels when lix_log_levels=['warn', 'error']", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_log_levels", value: ["warn", "error"] }],
	});

	await createLogs(lix);

	const logs = await getLogs(lix);

	expect(logs).toHaveLength(2); // warn, error
	expect(logs.find((log) => log.level === "debug")).toBeUndefined();
	expect(logs.find((log) => log.level === "info")).toBeUndefined();
	expect(logs.find((log) => log.level === "warn")?.message).toBe(
		"warn message"
	);
	expect(logs.find((log) => log.level === "warn")?.payload).toEqual({
		reason: "detected",
		path: "/tmp/example.txt",
	});
	expect(logs.find((log) => log.level === "error")?.message).toBe(
		"error message"
	);
	expect(logs.find((log) => log.level === "error")?.payload).toBeNull();
});

test("should insert only specified levels when lix_log_levels=['debug']", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_log_levels", value: ["debug"] }],
	});

	await createLogs(lix);

	const logs = await getLogs(lix);
	expect(logs).toHaveLength(1); // debug
	expect(logs.find((log) => log.level === "debug")?.message).toBeNull();
	expect(logs.find((log) => log.level === "debug")?.payload).toEqual({
		reason: "verbose",
		details: { retries: 0 },
	});
	expect(logs.find((log) => log.level === "info")).toBeUndefined();
	expect(logs.find((log) => log.level === "warn")).toBeUndefined();
	expect(logs.find((log) => log.level === "error")).toBeUndefined();
});

test("should insert all levels contain wildcard '*'", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_log_levels", value: ["*"] }],
	});

	await createLogs(lix);

	const logs = await getLogs(lix);
	expect(logs).toHaveLength(4); // debug, info, warn, error
	expect(logs.find((log) => log.level === "debug")?.message).toBeNull();
	expect(logs.find((log) => log.level === "debug")?.payload).toEqual({
		reason: "verbose",
		details: { retries: 0 },
	});
	expect(logs.find((log) => log.level === "info")?.message).toBe(
		"info message"
	);
	expect(logs.find((log) => log.level === "info")?.payload).toBeNull();
	expect(logs.find((log) => log.level === "warn")?.message).toBe(
		"warn message"
	);
	expect(logs.find((log) => log.level === "warn")?.payload).toEqual({
		reason: "detected",
		path: "/tmp/example.txt",
	});
	expect(logs.find((log) => log.level === "error")?.message).toBe(
		"error message"
	);
	expect(logs.find((log) => log.level === "error")?.payload).toBeNull();
});

async function createLogs(lix: Lix) {
	createLixOwnLogSync({
		engine: lix.engine!,
		key: "log_test_debug",
		level: "debug",
		payload: { reason: "verbose", details: { retries: 0 } },
	});
	createLixOwnLogSync({
		engine: lix.engine!,
		key: "log_test_info",
		level: "info",
		message: "info message",
		payload: null,
	});
	createLixOwnLogSync({
		engine: lix.engine!,
		key: "log_test_warn",
		level: "warn",
		message: "warn message",
		payload: { reason: "detected", path: "/tmp/example.txt" },
	});
	createLixOwnLogSync({
		engine: lix.engine!,
		key: "log_test_error",
		level: "error",
		message: "error message",
		payload: null,
	});
}

async function getLogs(lix: Lix): Promise<LixLog[]> {
	return lix.db
		.selectFrom("log")
		.where("key", "like", "log_test%")
		.selectAll()
		.execute();
}
