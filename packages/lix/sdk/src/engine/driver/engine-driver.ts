import { CompiledQuery, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import type { DatabaseConnection, Driver, QueryResult, Dialect } from "kysely";
import type { LixEngine } from "../types.js";

type EngineDriverConfig = {
  engine: LixEngine;
};

class EngineConnection implements DatabaseConnection {
  #engine: LixEngine;
  constructor(engine: LixEngine) {
    this.#engine = engine;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery;
    const res = await this.#engine.exec(sql, parameters as any[]);
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

export class EngineDriver implements Driver {
  readonly #config: EngineDriverConfig;
  #connection?: EngineConnection;

  constructor(config: EngineDriverConfig) {
    this.#config = config;
  }

  async init(): Promise<void> {
    this.#connection = new EngineConnection(this.#config.engine);
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
    await this.#config.engine.close();
  }
}

export function createDialect(args: { engine: LixEngine }): Dialect {
  return {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new EngineDriver({ engine: args.engine }),
    createIntrospector: (db: any) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
}
