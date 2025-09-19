import type { CompiledQuery, DatabaseConnection, QueryResult } from "kysely";
import type { SqliteWasmDatabase } from "../util/createInMemoryDatabase.js";

export class SqliteWasmConnection implements DatabaseConnection {
	readonly #db: SqliteWasmDatabase;

	constructor(db: SqliteWasmDatabase) {
		this.#db = db;
	}

	executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
		const { sql, parameters } = compiledQuery;

		const statementData = {
			rows: [],
			columns: [],
		};

		// we cant know what kind of query we are dealing with at that state - unless we switch to perpared statments
		// for now we collect all information required
		// save the changes before (total changes seems to be fast and worth the twoe extra round trips inspiration from https://github.com/WiseLibs/better-sqlite3/blob/254b8e93d78b1b03c9a2c777f4d304a0ea1530c6/src/objects/statement.lzz#L159)
		const totalChangesBefore = this.#db.changes(true);

		// execute the statement
		const rows = this.#db.exec({
			sql: sql,
			bind: parameters as any,
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: statementData.columns,
		});

		const lastInsertId = this.#db.sqlite3.capi.sqlite3_last_insert_rowid(
			this.#db
		);

		// check if we had changes in the db at all - if so - collect the number of changes
		const changes =
			totalChangesBefore === this.#db.changes(true) ? 0 : this.#db.changes();

		// console.log('sql: ' + sql);
		// console.log('result: ', rows);
		// We don't have knowledge about rather its update/delete/or select - so we return the results
		// @ts-expect-error - TODO for @martin-lysk - typescript complains
		return Promise.resolve({
			numAffectedRows: changes,
			insertId: lastInsertId,

			// queries with result
			rows: rows as O[],
		});
	}

	// eslint-disable-next-line require-yield
	async *streamQuery() {
		throw new Error("not supported for wasm driver yet");
	}
}
