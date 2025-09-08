import { CompiledQuery, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import type { DatabaseConnection, Driver, QueryResult, Dialect } from "kysely";
import type { LixBackend } from "../types.js";

type BackendDriverConfig = {
  backend: LixBackend;
};

class BackendConnection implements DatabaseConnection {
  #backend: LixBackend;
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
      res.lastInsertRowid !== undefined ? BigInt(res.lastInsertRowid) : undefined;
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
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
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
