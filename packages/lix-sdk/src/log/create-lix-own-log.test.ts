import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { Lix } from "../lix/open-lix.js";
import { createLixOwnLog } from "./create-lix-own-log.js";
import type { LixLog } from "./schema.js";
import { executeSync } from "../database/execute-sync.js";

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
	expect(logs.find((log) => log.level === "warn")?.message).toBe(
		"warn message"
	);
	expect(logs.find((log) => log.level === "error")?.message).toBe(
		"error message"
	);
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
	expect(logs.find((log) => log.level === "error")?.message).toBe(
		"error message"
	);
});

test("should insert only specified levels when lix_log_levels=['debug']", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_log_levels", value: ["debug"] }],
	});

	await createLogs(lix);

	const logs = await getLogs(lix);
	expect(logs).toHaveLength(1); // debug
	expect(logs.find((log) => log.level === "debug")?.message).toBe(
		"debug message"
	);
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
	expect(logs.find((log) => log.level === "debug")?.message).toBe(
		"debug message"
	);
	expect(logs.find((log) => log.level === "info")?.message).toBe(
		"info message"
	);
	expect(logs.find((log) => log.level === "warn")?.message).toBe(
		"warn message"
	);
	expect(logs.find((log) => log.level === "error")?.message).toBe(
		"error message"
	);
});

async function createLogs(lix: Lix) {
	await createLixOwnLog({
		lix,
		key: "lix.test.debug",
		level: "debug",
		message: "debug message",
	});
	await createLixOwnLog({
		lix,
		key: "lix.test.info",
		level: "info",
		message: "info message",
	});
	await createLixOwnLog({
		lix,
		key: "lix.test.warn",
		level: "warn",
		message: "warn message",
	});
	await createLixOwnLog({
		lix,
		key: "lix.test.error",
		level: "error",
		message: "error message",
	});
}

async function getLogs(lix: Lix): Promise<LixLog[]> {
	return lix.db.selectFrom("log").selectAll().execute();
}
