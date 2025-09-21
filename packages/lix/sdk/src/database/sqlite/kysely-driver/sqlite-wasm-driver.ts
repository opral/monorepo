import { CompiledQuery } from "kysely";
import type { DatabaseConnection, Driver } from "kysely";
import type { SqliteWasmDialectConfig } from "./sqlite-wasm-dialect-config.js";
import { ConnectionMutex } from "./connection-mutex.js";
import { SqliteWasmConnection } from "./sqlite-wasm-connection.js";
import type { SqliteWasmDatabase } from "../create-in-memory-database.js";

export class SqliteWasmDriver implements Driver {
	readonly #config: SqliteWasmDialectConfig;
	readonly #connectionMutex = new ConnectionMutex();

	#db?: SqliteWasmDatabase;
	#connection?: DatabaseConnection;

	constructor(config: SqliteWasmDialectConfig) {
		// this.#config = freeze({ ...config })
		this.#config = { ...config };
	}

	async init(): Promise<void> {
		this.#db =
			typeof this.#config.database === "function"
				? await this.#config.database()
				: this.#config.database;

		this.#connection = new SqliteWasmConnection(this.#db);

		if (this.#config.onCreateConnection) {
			await this.#config.onCreateConnection(this.#connection);
		}
	}

	async acquireConnection(): Promise<DatabaseConnection> {
		// SQLite only has one single connection. We use a mutex here to wait
		// until the single connection has been released.
		await this.#connectionMutex.lock();
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
		this.#connectionMutex.unlock();
	}

	async destroy(): Promise<void> {
		this.#db?.close();
	}
}
