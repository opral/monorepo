import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { tokenize } from "../../sql-parser/tokenizer.js";
import { maybeRewriteInsteadOfTrigger } from "./rewrite.js";

function executeRewritten(
	engine: NonNullable<Awaited<ReturnType<typeof openLix>>["engine"]>,
	rewritten: { sql: string },
	allParameters: ReadonlyArray<unknown>
): { rows: any[] } {
	const statements = rewritten.sql
		.split(/;\s*(?:\n|$)/)
		.map((stmt) => stmt.trim())
		.filter((stmt) => stmt.length > 0);
	const collected: any[] = [];
	for (const statement of statements) {
		const { sql, parameters } = normalizeStatement(statement, allParameters);
		const columnNames: string[] = [];
		const rows = engine.sqlite.exec({
			sql,
			bind: parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames,
		}) as any[];
		if (columnNames.length > 0 && rows.length > 0) {
			collected.push(...rows);
		}
	}
	return { rows: collected };
}

function normalizeStatement(
	statement: string,
	allParams: ReadonlyArray<unknown>
): { sql: string; parameters: unknown[] } {
	const matches = [...statement.matchAll(/\?(\d+)/g)];
	if (matches.length === 0) {
		return {
			sql: statement.endsWith(";") ? statement : `${statement};`,
			parameters: [],
		};
	}
	let next = 1;
	const mapping = new Map<number, number>();
	const orderedParams: unknown[] = [];
	const rewrittenSql = statement.replace(/\?(\d+)/g, (_match, raw: string) => {
		const original = Number(raw);
		if (!Number.isFinite(original) || original <= 0) {
			return "?";
		}
		let local = mapping.get(original);
		if (local === undefined) {
			local = next++;
			mapping.set(original, local);
			orderedParams.push(allParams[original - 1]);
		}
		return `?${local}`;
	});
	const normalizedSql = rewrittenSql.endsWith(";")
		? rewrittenSql
		: `${rewrittenSql};`;
	return {
		sql: normalizedSql,
		parameters: orderedParams,
	};
}

describe("maybeRewriteInsteadOfTrigger", () => {
	test("returns null when no trigger exists", async () => {
		const lix = await openLix({});
		const tokens = tokenize("INSERT INTO missing_view VALUES (1)");

		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql: "INSERT INTO missing_view VALUES (1)",
			tokens,
			parameters: [],
			op: "insert",
		});

		expect(rewritten).toBeNull();
		await lix.close();
	});

	test("returns trigger body when no NEW/OLD references", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
		CREATE VIEW rewrite_view AS SELECT schema_key FROM lix_internal_state_vtable;
		CREATE TRIGGER rewrite_view_insert
		INSTEAD OF INSERT ON rewrite_view
		BEGIN
			SELECT schema_key FROM lix_internal_state_vtable;
		END;
	`);

		const tokens = tokenize("INSERT INTO rewrite_view DEFAULT VALUES");
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql: "INSERT INTO rewrite_view DEFAULT VALUES",
			tokens,
			parameters: [],
			op: "insert",
		});

		expect(rewritten?.sql.trim()).toBe(
			"SELECT schema_key FROM lix_internal_state_vtable;"
		);

		const postRewrite = lix.engine!.preprocessQuery({
			sql: rewritten!.sql,
			parameters: [],
			sideEffects: false,
		});

		expect(postRewrite.sql).toContain("lix_internal_state_vtable_rewritten");
		await lix.close();
	});

	test("rewrites NEW references for single-row INSERT", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink (
					message TEXT,
					code TEXT
				);
				CREATE VIEW rewrite_view AS SELECT 1 AS message, 2 AS code;
				CREATE TRIGGER rewrite_view_insert
				INSTEAD OF INSERT ON rewrite_view
				BEGIN
					INSERT INTO sink VALUES (NEW.message, NEW.code);
			END;
		`);

		const sql = "INSERT INTO rewrite_view (message, code) VALUES (?, upper(?))";
		const tokens = tokenize(sql);
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens,
			parameters: ["hi", "id"],
			op: "insert",
		});

		expect(rewritten?.sql).toBe("INSERT INTO sink VALUES (?1, upper(?2));");
		executeRewritten(lix.engine!, rewritten!, ["hi", "id"]);
		const { rows } = lix.engine!.executeSync({
			sql: "SELECT message, code FROM sink",
			parameters: [],
		});
		expect(rows).toEqual([{ message: "hi", code: "ID" }]);
		await lix.close();
	});

	test("rewrites multi-row INSERT preserving parameter order", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink (
					id TEXT,
					value INTEGER
				);
				CREATE VIEW multi_view AS SELECT 1 AS id, 2 AS value;
				CREATE TRIGGER multi_view_insert
				INSTEAD OF INSERT ON multi_view
				BEGIN
					INSERT INTO sink VALUES (NEW.id, NEW.value);
			END;
		`);

		const sql = "INSERT INTO multi_view (id, value) VALUES (?, ?), (?, ?)";
		const tokens = tokenize(sql);
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens,
			parameters: ["a", 1, "b", 2],
			op: "insert",
		});

		const normalizedSql = rewritten?.sql.replace(/\s+/g, " ").trim() ?? "";
		expect(normalizedSql).toMatch(
			/^INSERT INTO sink VALUES \(\?1, \?2\), \(\?3, \?4\)\s*;$/
		);
		executeRewritten(lix.engine!, rewritten!, ["a", 1, "b", 2]);
		const { rows } = lix.engine!.executeSync({
			sql: "SELECT id, value FROM sink ORDER BY rowid",
			parameters: [],
		});
		expect(rows).toEqual([
			{ id: "a", value: 1 },
			{ id: "b", value: 2 },
		]);
		await lix.close();
	});

	test("rewrites complex multi-row INSERT via trigger pipeline", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE mock_state (
					entity_id TEXT,
					schema_key TEXT,
					payload TEXT,
					flag INTEGER
				);
				CREATE VIEW mock_trigger_view AS
				SELECT
					'' AS source_id,
					'' AS target_schema,
					'' AS payload;
				CREATE TRIGGER mock_trigger_view_insert
				INSTEAD OF INSERT ON mock_trigger_view
				BEGIN
					INSERT INTO mock_state (
						entity_id,
						schema_key,
						payload,
						flag
					) VALUES (
						'mock_' || NEW.source_id,
						NEW.target_schema,
						NEW.payload,
						1
					);
				END;
		`);

		const sql =
			"INSERT INTO mock_trigger_view (source_id, target_schema, payload) VALUES (?, ?, ?), (?, ?, ?)";
		const tokens = tokenize(sql);
		const parameters = [
			"alpha",
			"mock_schema",
			'{"foo":1}',
			"beta",
			"mock_schema",
			'{"foo":2}',
		];
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens,
			parameters,
			op: "insert",
		});

		expect(rewritten).not.toBeNull();
		const normalizedSql = rewritten?.sql.replace(/\s+/g, " ") ?? "";
		expect(normalizedSql).toContain("INSERT INTO mock_state");
		const compactSql = normalizedSql.replace(/\s+/g, "");
		expect(compactSql).toContain(
			"VALUES('mock_'||?1,?2,?3,1),('mock_'||?4,?5,?6,1);"
		);

		executeRewritten(lix.engine!, rewritten!, parameters);
		const { rows } = lix.engine!.executeSync({
			sql: `SELECT entity_id, schema_key, payload, flag
			FROM mock_state
			ORDER BY entity_id`,
			parameters: [],
		});

		const inserted = rows.filter(
			(row: any) =>
				row.entity_id === "mock_alpha" || row.entity_id === "mock_beta"
		);

		expect(inserted).toEqual(
			expect.arrayContaining([
				{
					entity_id: "mock_alpha",
					schema_key: "mock_schema",
					payload: '{"foo":1}',
					flag: 1,
				},
				{
					entity_id: "mock_beta",
					schema_key: "mock_schema",
					payload: '{"foo":2}',
					flag: 1,
				},
			])
		);
		expect(inserted.length).toBeGreaterThanOrEqual(2);

		await lix.close();
	});

	test("fills missing columns with NULL when not provided", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink (
					id INTEGER,
					description TEXT,
					status TEXT
				);
				CREATE VIEW sparse_view AS SELECT 1 AS id, 2 AS description, 3 AS status;
				CREATE TRIGGER sparse_view_insert
				INSTEAD OF INSERT ON sparse_view
				BEGIN
					INSERT INTO sink VALUES (NEW.id, NEW.description, NEW.status);
			END;
		`);

		const sql = "INSERT INTO sparse_view (id) VALUES (?)";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: [123],
			op: "insert",
		});

		expect(rewritten?.sql).toBe("INSERT INTO sink VALUES (?1, NULL, NULL);");
		executeRewritten(lix.engine!, rewritten!, [123]);
		const { rows } = lix.engine!.executeSync({
			sql: "SELECT id, description, status FROM sink",
			parameters: [],
		});
		expect(rows).toEqual([{ id: 123, description: null, status: null }]);
		await lix.close();
	});

	test("rewrites INSERT DEFAULT VALUES", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink (
					id INTEGER,
					flag INTEGER
				);
				CREATE VIEW default_view AS SELECT 1 AS id, 2 AS flag;
				CREATE TRIGGER default_view_insert
				INSTEAD OF INSERT ON default_view
				BEGIN
					INSERT INTO sink VALUES (NEW.id, NEW.flag);
			END;
		`);

		const sql = "INSERT INTO default_view DEFAULT VALUES";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: [],
			op: "insert",
		});

		expect(rewritten?.sql).toBe("INSERT INTO sink VALUES (NULL, NULL);");
		executeRewritten(lix.engine!, rewritten!, []);
		const { rows } = lix.engine!.executeSync({
			sql: "SELECT id, flag FROM sink",
			parameters: [],
		});
		expect(rows).toEqual([{ id: null, flag: null }]);
		await lix.close();
	});

	test("rewrite INSERT supports RETURNING", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink (
					message TEXT,
					code TEXT
				);
				CREATE VIEW rewrite_view AS SELECT 1 AS message, 2 AS code;
				CREATE TRIGGER rewrite_view_insert
				INSTEAD OF INSERT ON rewrite_view
				BEGIN
					INSERT INTO sink VALUES (NEW.message, NEW.code);
				END;
			`);

		const sql =
			"INSERT INTO rewrite_view (message, code) VALUES (?, upper(?)) RETURNING message, code";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: ["hi", "id"],
			op: "insert",
		});

		const result = executeRewritten(lix.engine!, rewritten!, ["hi", "id"]);
		expect(result.rows).toEqual([{ message: "hi", code: "ID" }]);

		const { rows } = lix.engine!.executeSync({
			sql: "SELECT message, code FROM sink",
			parameters: [],
		});
		expect(rows).toEqual([{ message: "hi", code: "ID" }]);
		await lix.close();
	});

	test("returns null when NEW references cannot be substituted", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE VIEW complex_view AS SELECT 1 AS id;
			CREATE TRIGGER complex_view_insert
			INSTEAD OF INSERT ON complex_view
			BEGIN
				INSERT INTO sink SELECT NEW.id;
			END;
		`);

		const sql = "INSERT INTO complex_view (id) SELECT 1";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: [],
			op: "insert",
		});

		expect(rewritten).toBeNull();
		await lix.close();
	});

	test("rewrites trigger RAISE calls to lix_trigger_raise", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE VIEW raise_view AS SELECT 1 AS id;
				CREATE TRIGGER raise_view_insert
				INSTEAD OF INSERT ON raise_view
				BEGIN
					SELECT RAISE(FAIL, 'boom');
				END;
			`);

		const sql = "INSERT INTO raise_view DEFAULT VALUES";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: [],
			op: "insert",
		});

		expect(rewritten?.sql).toContain("lix_trigger_raise('FAIL', 'boom')");
		expect(() => executeRewritten(lix.engine!, rewritten!, [])).toThrowError(
			/boom/
		);
		await lix.close();
	});

	test("rewrites UPDATE trigger NEW references with WHERE clause", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink_update(id TEXT PRIMARY KEY, value TEXT);
				CREATE VIEW update_view AS SELECT id, value FROM sink_update;
				CREATE TRIGGER update_view_update
				INSTEAD OF UPDATE ON update_view
				BEGIN
					UPDATE sink_update SET value = NEW.value WHERE id = NEW.id;
				END;
		`);

		lix.engine!.executeSync({
			sql: "INSERT INTO sink_update (id, value) VALUES ('row', 'old')",
			parameters: [],
		});

		const sql = "UPDATE update_view SET value = ? WHERE id = ?";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: ["new", "row"],
			op: "update",
		});

		expect(rewritten?.sql).toContain(
			'WITH __lix_old AS (SELECT * FROM "update_view" WHERE id = ?2)'
		);
		expect(rewritten?.sql).toContain(
			'UPDATE sink_update SET value = (?1) WHERE id = (SELECT "id" FROM __lix_old LIMIT 1);'
		);
		executeRewritten(lix.engine!, rewritten!, ["new", "row"]);
		const { rows } = lix.engine!.executeSync({
			sql: "SELECT value FROM sink_update WHERE id = 'row'",
			parameters: [],
		});
		expect(rows).toEqual([{ value: "new" }]);
		await lix.close();
	});

	test("rewrites DELETE trigger OLD references", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
				CREATE TABLE sink_delete(id TEXT PRIMARY KEY);
				CREATE VIEW delete_view AS SELECT id FROM sink_delete;
				CREATE TRIGGER delete_view_delete
				INSTEAD OF DELETE ON delete_view
				BEGIN
					DELETE FROM sink_delete WHERE id = OLD.id;
				END;
		`);

		lix.engine!.executeSync({
			sql: "INSERT INTO sink_delete (id) VALUES ('row')",
			parameters: [],
		});

		const sql = "DELETE FROM delete_view WHERE id = ?";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: ["row"],
			op: "delete",
		});

		expect(rewritten?.sql).toContain(
			'WITH __lix_old AS (SELECT * FROM "delete_view" WHERE id = ?1)'
		);
		expect(rewritten?.sql).toContain(
			'DELETE FROM sink_delete WHERE id = (SELECT "id" FROM __lix_old LIMIT 1);'
		);
		executeRewritten(lix.engine!, rewritten!, ["row"]);
		const { rows } = lix.engine!.executeSync({
			sql: "SELECT id FROM sink_delete",
			parameters: [],
		});
		expect(rows).toEqual([]);
		await lix.close();
	});

	test("rewrite UPDATE supports RETURNING", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
			CREATE TABLE sink_update(id TEXT PRIMARY KEY, value TEXT);
			CREATE VIEW update_view AS SELECT id, value FROM sink_update;
			CREATE TRIGGER update_view_update
			INSTEAD OF UPDATE ON update_view
			BEGIN
				UPDATE sink_update SET value = NEW.value WHERE id = NEW.id;
			END;
		`);

		lix.engine!.executeSync({
			sql: "INSERT INTO sink_update (id, value) VALUES ('row', 'old')",
			parameters: [],
		});

		const sql = "UPDATE update_view SET value = ? WHERE id = ? RETURNING value";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: ["new", "row"],
			op: "update",
		});

		const result = executeRewritten(lix.engine!, rewritten!, ["new", "row"]);
		expect(result.rows).toEqual([{ value: "new" }]);

		const { rows } = lix.engine!.executeSync({
			sql: "SELECT value FROM sink_update WHERE id = 'row'",
			parameters: [],
		});
		expect(rows).toEqual([{ value: "new" }]);
		await lix.close();
	});

	test("rewrite DELETE supports RETURNING", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
			CREATE TABLE sink_delete(id TEXT PRIMARY KEY);
			CREATE VIEW delete_view AS SELECT id FROM sink_delete;
			CREATE TRIGGER delete_view_delete
			INSTEAD OF DELETE ON delete_view
			BEGIN
				DELETE FROM sink_delete WHERE id = OLD.id;
			END;
		`);

		lix.engine!.executeSync({
			sql: "INSERT INTO sink_delete (id) VALUES ('row')",
			parameters: [],
		});

		const sql = "DELETE FROM delete_view WHERE id = ? RETURNING id";
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql,
			tokens: tokenize(sql),
			parameters: ["row"],
			op: "delete",
		});

		const result = executeRewritten(lix.engine!, rewritten!, ["row"]);
		expect(result.rows).toEqual([{ id: "row" }]);

		const { rows } = lix.engine!.executeSync({
			sql: "SELECT id FROM sink_delete",
			parameters: [],
		});
		expect(rows).toEqual([]);
		await lix.close();
	});
});
