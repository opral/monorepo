import {
	CompiledQuery,
	DatabaseConnection,
	Dialect,
	Driver,
	QueryResult,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from 'kysely';
import { SQLocal } from '../index.js';
import type { Transaction } from '../types.js';

export class SQLocalKysely extends SQLocal {
	dialect: Dialect = {
		createAdapter: () => new SqliteAdapter(),
		createDriver: () => new SQLocalKyselyDriver(this),
		createIntrospector: (db) => new SqliteIntrospector(db),
		createQueryCompiler: () => new SqliteQueryCompiler(),
	};
}

class SQLocalKyselyDriver implements Driver {
	constructor(private client: SQLocalKysely) {}

	async init(): Promise<void> {}

	async acquireConnection(): Promise<SQLocalKyselyConnection> {
		return new SQLocalKyselyConnection(this.client);
	}

	async releaseConnection(): Promise<void> {}

	async beginTransaction(connection: SQLocalKyselyConnection): Promise<void> {
		connection.transaction = await this.client.beginTransaction();
	}

	async commitTransaction(connection: SQLocalKyselyConnection): Promise<void> {
		await connection.transaction?.commit();
		connection.transaction = null;
	}

	async rollbackTransaction(
		connection: SQLocalKyselyConnection
	): Promise<void> {
		await connection.transaction?.rollback();
		connection.transaction = null;
	}

	async destroy(): Promise<void> {
		await this.client.destroy();
	}
}

class SQLocalKyselyConnection implements DatabaseConnection {
	transaction: Transaction | null = null;

	constructor(private client: SQLocalKysely) {}

	async executeQuery<Result>(
		query: CompiledQuery
	): Promise<QueryResult<Result>> {
		let rows;

		if (this.transaction === null) {
			rows = await this.client.sql(query.sql, ...query.parameters);
		} else {
			rows = await this.transaction.query(query);
		}

		return {
			rows: rows as Result[],
		};
	}

	async *streamQuery(): AsyncGenerator<never, void, unknown> {
		throw new Error('SQLite3 does not support streaming.');
	}
}
