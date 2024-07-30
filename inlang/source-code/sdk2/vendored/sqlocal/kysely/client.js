import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler, } from 'kysely';
import { SQLocal } from '../index.js';
export class SQLocalKysely extends SQLocal {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "dialect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                createAdapter: () => new SqliteAdapter(),
                createDriver: () => new SQLocalKyselyDriver(this),
                createIntrospector: (db) => new SqliteIntrospector(db),
                createQueryCompiler: () => new SqliteQueryCompiler(),
            }
        });
    }
}
class SQLocalKyselyDriver {
    constructor(client) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: client
        });
    }
    async init() { }
    async acquireConnection() {
        return new SQLocalKyselyConnection(this.client);
    }
    async releaseConnection() { }
    async beginTransaction(connection) {
        connection.transaction = await this.client.beginTransaction();
    }
    async commitTransaction(connection) {
        await connection.transaction?.commit();
        connection.transaction = null;
    }
    async rollbackTransaction(connection) {
        await connection.transaction?.rollback();
        connection.transaction = null;
    }
    async destroy() {
        await this.client.destroy();
    }
}
class SQLocalKyselyConnection {
    constructor(client) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: client
        });
        Object.defineProperty(this, "transaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    async executeQuery(query) {
        let rows;
        if (this.transaction === null) {
            rows = await this.client.sql(query.sql, ...query.parameters);
        }
        else {
            rows = await this.transaction.query(query);
        }
        return {
            rows: rows,
        };
    }
    async *streamQuery() {
        throw new Error('SQLite3 does not support streaming.');
    }
}
//# sourceMappingURL=client.js.map