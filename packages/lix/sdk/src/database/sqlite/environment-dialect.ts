import {
	CompiledQuery,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from "kysely";
import type { DatabaseConnection, Driver, QueryResult, Dialect } from "kysely";
import type { LixEnvironment } from "../../environment/api.js";

type LixEnvironmentDriverConfig = {
	backend: LixEnvironment;
};

class EnvironmentConnection implements DatabaseConnection {
	#backend: LixEnvironment;
	// Track nested transaction depth for savepoint emulation
	_txDepth = 0;
	_spNames: string[] = [];
	constructor(backend: LixEnvironment) {
		this.#backend = backend;
	}

	async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
		const { sql, parameters } = compiledQuery;
		let res: any;
		try {
			res = await this.#backend.call("lix_execute_sync", {
				sql,
				parameters: (parameters ?? []) as unknown[],
			});
		} catch (err: any) {
			const previewParam = (v: unknown) => {
				try {
					if (v instanceof Uint8Array) return `Uint8Array(len=${v.byteLength})`;
					if (typeof v === "string") return JSON.stringify(v);
					if (v && typeof v === "object") return JSON.stringify(v);
					return String(v);
				} catch {
					return String(v);
				}
			};
			// Example formatted error for quick reference:
			//
			// executeQuery Error
			//
			//   - cause: "version_id is required for state mutation"
			//   - sql:   insert into "file" ("id","path","data") values (?, ?, ?)
			//   - params:
			//       1: "WghuxhzbSR0XM7wdw5Pdd"
			//       2: "/x.md"
			//       3: Uint8Array(len=0)
			const lines: string[] = [];
			lines.push("executeQuery Error\n");
			lines.push(`  - cause: "${String(err?.message ?? err)}"`);
			lines.push(`  - sql:   ${sql}`);
			const rewrittenSql = err?.rewrittenSql;
			if (
				typeof rewrittenSql === "string" &&
				rewrittenSql &&
				rewrittenSql !== sql
			) {
				lines.push(`  - rewrittenSql: ${rewrittenSql}`);
			}
			lines.push("  - params:");
			(parameters ?? []).forEach((p, i) => {
				lines.push(`      ${i + 1}: ${previewParam(p)}`);
			});
			const wrapped = new Error(lines.join("\n"), { cause: err });
			throw wrapped;
		}
		// Map to Kysely QueryResult shape (no affected rows/insert id available)
		return {
			rows: (res?.rows ?? []) as O[],
		} as QueryResult<O>;
	}

	// eslint-disable-next-line require-yield
	async *streamQuery() {
		throw new Error("not supported for engine driver yet");
	}
}

export class EnvironmentDriver implements Driver {
	readonly #config: LixEnvironmentDriverConfig;

	// Global transaction coordination for a single engine.
	// Ensures only one top‑level transaction owner at a time.
	#owner?: EnvironmentConnection;
	#depth = 0; // total nesting depth for owner
	#waiters: Array<() => void> = [];

	constructor(config: LixEnvironmentDriverConfig) {
		this.#config = config;
	}

	async init(): Promise<void> {
		// no-op
	}

	async acquireConnection(): Promise<DatabaseConnection> {
		// Return a lightweight connection wrapper per acquire to isolate
		// transaction state (savepoints) across concurrent transactions.
		return new EnvironmentConnection(this.#config.backend);
	}

	async beginTransaction(connection: DatabaseConnection): Promise<void> {
		const conn = connection as unknown as EnvironmentConnection;

		// Wait our turn if another connection owns the top‑level transaction
		while (this.#depth > 0 && this.#owner !== conn) {
			await new Promise<void>((resolve) => this.#waiters.push(resolve));
		}

		if (this.#depth === 0) {
			// Acquire ownership and start top‑level txn
			this.#owner = conn;
			this.#depth = 1;
			conn._txDepth = 1;
			await connection.executeQuery(CompiledQuery.raw("begin"));
		} else {
			// Nested transaction owned by same connection → savepoint
			this.#depth++;
			conn._txDepth++;
			const spName = `lix_sp_${this.#depth}`;
			conn._spNames.push(spName);
			await connection.executeQuery(CompiledQuery.raw(`savepoint ${spName}`));
		}
	}

	async commitTransaction(connection: DatabaseConnection): Promise<void> {
		const conn = connection as unknown as EnvironmentConnection;
		if (this.#owner !== conn) {
			throw new Error("commit from non-owner connection");
		}

		if (conn._txDepth > 1) {
			const spName = conn._spNames.pop()!;
			await connection.executeQuery(
				CompiledQuery.raw(`release savepoint ${spName}`)
			);
			conn._txDepth--;
			this.#depth--;
		} else {
			await connection.executeQuery(CompiledQuery.raw("commit"));
			conn._txDepth = 0;
			this.#depth = 0;
			this.#owner = undefined;
			const w = this.#waiters.shift();
			if (w) w();
		}
	}

	async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
		const conn = connection as unknown as EnvironmentConnection;
		if (this.#owner !== conn) {
			throw new Error("rollback from non-owner connection");
		}
		if (conn._txDepth > 1) {
			const spName = conn._spNames.pop()!;
			await connection.executeQuery(
				CompiledQuery.raw(`rollback to savepoint ${spName}`)
			);
			conn._txDepth--;
			this.#depth--;
		} else {
			await connection.executeQuery(CompiledQuery.raw("rollback"));
			conn._txDepth = 0;
			this.#depth = 0;
			this.#owner = undefined;
			const w = this.#waiters.shift();
			if (w) w();
		}
	}

	async releaseConnection(): Promise<void> {
		// no-op
	}

	async destroy(): Promise<void> {
		await this.#config.backend.close();
	}
}

export function createEnvironmentDialect(args: {
	environment: LixEnvironment;
}): Dialect {
	return {
		createAdapter: () => new SqliteAdapter(),
		createDriver: () => new EnvironmentDriver({ backend: args.environment }),
		createIntrospector: (db: any) => new SqliteIntrospector(db),
		createQueryCompiler: () => new SqliteQueryCompiler(),
	};
}
