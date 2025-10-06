import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { collectDmlTriggers } from "./collect.js";

describe("collectDmlTriggers", () => {
	test("finds INSTEAD OF INSERT trigger and extracts body", async () => {
		const lix = await openLix({});
		lix.engine!.sqlite.exec(`
				CREATE TABLE mock_sink (value TEXT);
				CREATE VIEW mock_view AS SELECT 1 AS value;
				CREATE TRIGGER mock_view_insert
				INSTEAD OF INSERT ON mock_view
				BEGIN
					INSERT INTO mock_sink(value) VALUES (NEW.value);
				END;
			`);

		const triggers = collectDmlTriggers({ sqlite: lix.engine!.sqlite });
		const trigger = triggers.find((entry) => entry.name === "mock_view_insert");

		expect(trigger).toBeDefined();
		expect(trigger?.target).toBe("mock_view");
		expect(trigger?.operation).toBe("insert");
		expect(trigger?.bodySql).toContain("INSERT INTO mock_sink");
		expect(trigger?.rawSql).toMatch(/CREATE\s+TRIGGER\s+mock_view_insert/i);
		await lix.close();
	});

	test("detects mixed-case INSTEAD OF triggers across operations", async () => {
		const lix = await openLix({});
		lix.engine!.sqlite.exec(`
				CREATE TABLE multi_sink (op TEXT);
				CREATE VIEW multi_view AS SELECT 1 AS id;
				CREATE TRIGGER multi_view_insert
				INSTEAD of insert ON multi_view
				BEGIN
					INSERT INTO multi_sink(op) VALUES ('insert');
				END;
				CREATE TRIGGER multi_view_update
				inStead OF UPDATE ON multi_view
				BEGIN
					INSERT INTO multi_sink(op) VALUES ('update');
				END;
				CREATE TRIGGER multi_view_delete
				instead of delete ON multi_view
				BEGIN
					INSERT INTO multi_sink(op) VALUES ('delete');
				END;
				CREATE TABLE table_target (value INTEGER);
				CREATE TRIGGER table_after
				AFTER INSERT ON table_target
				BEGIN
					SELECT 1;
				END;
			`);

		const triggers = collectDmlTriggers({ sqlite: lix.engine!.sqlite });
		const targetTriggers = triggers.filter(
			(entry) => entry.target === "multi_view"
		);

		expect(targetTriggers.map((entry) => entry.name)).toEqual(
			expect.arrayContaining([
				"multi_view_insert",
				"multi_view_update",
				"multi_view_delete",
			])
		);

		const operations = new Map(
			targetTriggers.map((entry) => [entry.name, entry.operation])
		);

		expect(operations.get("multi_view_insert")).toBe("insert");
		expect(operations.get("multi_view_update")).toBe("update");
		expect(operations.get("multi_view_delete")).toBe("delete");

		expect(
			triggers.find((entry) => entry.name === "table_after")
		).toBeUndefined();
		await lix.close();
	});
});
