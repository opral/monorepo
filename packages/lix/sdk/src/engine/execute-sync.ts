import type { SqliteWasmDatabase } from "../database/sqlite/create-in-memory-database.js";

export function createExecuteSync(args: { sqlite: SqliteWasmDatabase }) {
	return (args2: {
		sql: string;
		parameters?: Readonly<unknown[]>;
	}): {
		rows: any[];
	} => {
		const columnNames: string[] = [];
		const rows = args.sqlite.exec({
			sql: args2.sql,
			bind: (args2.parameters ?? []) as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames,
		});
		return { rows };
	};
}
