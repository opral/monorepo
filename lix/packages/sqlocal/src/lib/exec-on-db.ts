import { RawResultData, Sqlite3Db, Sqlite3Method } from '../types.js';

export function execOnDb(
	db: Sqlite3Db,
	statement: { sql: string; params: any[]; method?: Sqlite3Method }
): RawResultData {
	const statementData: RawResultData = {
		rows: [],
		columns: [],
	};

	const rows = db.exec({
		sql: statement.sql,
		bind: statement.params,
		returnValue: 'resultRows',
		rowMode: 'array',
		columnNames: statementData.columns,
	});

	switch (statement.method) {
		case 'run':
			break;
		case 'get':
			statementData.rows = rows[0];
			break;
		case 'all':
		default:
			statementData.rows = rows;
			break;
	}

	return statementData;
}
