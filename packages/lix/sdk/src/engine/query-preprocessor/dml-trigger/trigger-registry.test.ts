import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { findInsteadOfTrigger } from "./trigger-registry.js";

const createViewSql = `
CREATE VIEW scoped_view AS SELECT 1 AS id;
CREATE TRIGGER scoped_view_ins
INSTEAD OF INSERT ON scoped_view
BEGIN
  SELECT 'insert';
END;
CREATE TRIGGER scoped_view_upd
INSTEAD OF UPDATE ON scoped_view
BEGIN
  SELECT 'update';
END;
`;

describe("findInsteadOfTrigger", () => {
	test("returns trigger by target and operation", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(createViewSql);

		const insertTrig = findInsteadOfTrigger({
			engine: lix.engine!,
			target: "scoped_view",
			operation: "insert",
		});

		expect(insertTrig?.name).toBe("scoped_view_ins");

		const updateTrig = findInsteadOfTrigger({
			engine: lix.engine!,
			target: "Scoped_View",
			operation: "update",
		});

		expect(updateTrig?.name).toBe("scoped_view_upd");

		await lix.close();
	});

	test("invalidates cache when schema changes", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
			CREATE VIEW "QuotedView" AS SELECT 1 AS value;
			CREATE TRIGGER quoted_view_insert
			INSTEAD OF INSERT ON "QuotedView"
			BEGIN
				SELECT 'initial';
			END;
		`);

		const initial = findInsteadOfTrigger({
			engine: lix.engine!,
			target: "quotedview",
			operation: "insert",
		});

		expect(initial?.name).toBe("quoted_view_insert");

		lix.engine!.sqlite.exec(`
			DROP TRIGGER IF EXISTS quoted_view_insert;
			CREATE TRIGGER quoted_view_insert
			INSTEAD OF INSERT ON "QuotedView"
			BEGIN
				SELECT 'replacement';
			END;
		`);

		const refreshed = findInsteadOfTrigger({
			engine: lix.engine!,
			target: '"QuotedView"',
			operation: "insert",
		});

		expect(refreshed?.bodySql).toContain("replacement");

		await lix.close();
	});
});
