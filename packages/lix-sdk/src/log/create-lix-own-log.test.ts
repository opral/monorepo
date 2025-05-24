import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { Lix } from "../lix/open-lix.js";
import type { Log } from "./schema.js";
import { createLixOwnLog } from "./create-lix-own-log.js";

test("should insert logs default log levels when lix_log_levels is not set)", async () => {
	const lix = await openLixInMemory({});

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
	const lix = await openLixInMemory({});

	await setLogLevels(lix, ["warn", "error"]);
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
	const lix = await openLixInMemory({});
	await setLogLevels(lix, ["debug"]);
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

test("should insert all levels when lix_log_levels=['*']", async () => {
	const lix = await openLixInMemory({});
	await setLogLevels(lix, ["*"]);
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

async function getLogs(lix: Lix): Promise<Log[]> {
	return lix.db.selectFrom("log").selectAll().execute();
}

// Helper to set the lix_log_levels key
async function setLogLevels(lix: Lix, levels: string[]) {
	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_log_levels",
			value: JSON.stringify(levels),
			skip_change_control: true,
		})
		.onConflict((oc) =>
			oc.column("key").doUpdateSet({ value: JSON.stringify(levels) })
		)
		.execute();
}
