import {
	CompiledQuery,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from "kysely";
import type { DatabaseConnection, Driver, QueryResult, Dialect } from "kysely";
import type { LixBackend } from "../types.js";

type BackendDriverConfig = {
	backend: LixBackend;
};

class BackendConnection implements DatabaseConnection {
	#backend: LixBackend;
	// Track nested transaction depth for savepoint emulation
	_txDepth = 0;
	_spNames: string[] = [];
	constructor(backend: LixBackend) {
		this.#backend = backend;
	}

	async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
		const { sql, parameters } = compiledQuery;
		const res = await this.#backend.exec(sql, parameters as any[]);
		// Map to Kysely QueryResult shape
		const numAffectedRows =
			res.changes !== undefined ? BigInt(res.changes) : undefined;
		const insertId =
			res.lastInsertRowid !== undefined
				? BigInt(res.lastInsertRowid)
				: undefined;
		return {
			rows: (res.rows ?? []) as O[],
			numAffectedRows,
			insertId,
		} as QueryResult<O>;
	}

	// eslint-disable-next-line require-yield
	async *streamQuery() {
		throw new Error("not supported for engine driver yet");
	}
}

export class BackendDriver implements Driver {
	readonly #config: BackendDriverConfig;
	#connection?: BackendConnection;

	constructor(config: BackendDriverConfig) {
		this.#config = config;
	}

	async init(): Promise<void> {
		this.#connection = new BackendConnection(this.#config.backend);
	}

	async acquireConnection(): Promise<DatabaseConnection> {
		return this.#connection!;
	}

	async beginTransaction(connection: DatabaseConnection): Promise<void> {
		const conn = connection as unknown as BackendConnection;
		conn._txDepth++;
		if (conn._txDepth === 1) {
			await connection.executeQuery(CompiledQuery.raw("begin"));
		} else {
			const spName = `lix_sp_${conn._txDepth}`;
			conn._spNames.push(spName);
			await connection.executeQuery(CompiledQuery.raw(`savepoint ${spName}`));
		}
	}

	async commitTransaction(connection: DatabaseConnection): Promise<void> {
		const conn = connection as unknown as BackendConnection;
		if (conn._txDepth > 1) {
			const spName = conn._spNames.pop()!;
			await connection.executeQuery(
				CompiledQuery.raw(`release savepoint ${spName}`)
			);
		} else {
			await connection.executeQuery(CompiledQuery.raw("commit"));
		}
		conn._txDepth = Math.max(0, conn._txDepth - 1);
	}

	async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
		const conn = connection as unknown as BackendConnection;
		if (conn._txDepth > 1) {
			const spName = conn._spNames.pop()!;
			await connection.executeQuery(
				CompiledQuery.raw(`rollback to savepoint ${spName}`)
			);
		} else {
			await connection.executeQuery(CompiledQuery.raw("rollback"));
		}
		conn._txDepth = Math.max(0, conn._txDepth - 1);
	}

	async releaseConnection(): Promise<void> {
		// no-op
	}

	async destroy(): Promise<void> {
		await this.#config.backend.close();
	}
}

export function createDialect(args: { backend: LixBackend }): Dialect {
	return {
		createAdapter: () => new SqliteAdapter(),
		createDriver: () => new BackendDriver({ backend: args.backend }),
		createIntrospector: (db: any) => new SqliteIntrospector(db),
		createQueryCompiler: () => new SqliteQueryCompiler(),
	};
}
