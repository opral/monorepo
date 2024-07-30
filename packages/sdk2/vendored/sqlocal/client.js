import coincident from 'coincident';
import { sqlTag } from './lib/sql-tag.js';
import { convertRowsToObjects } from './lib/convert-rows-to-objects.js';
import { normalizeStatement } from './lib/normalize-statement.js';
import { getQueryKey } from './lib/get-query-key.js';
import { normalizeSql } from './lib/normalize-sql.js';
export class SQLocal {
    constructor(config) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "worker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "proxy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isWorkerDestroyed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "userCallbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "queriesInProgress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "processMessageEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => {
                const message = event.data;
                const queries = this.queriesInProgress;
                switch (message.type) {
                    case 'success':
                    case 'data':
                    case 'error':
                    case 'export':
                    case 'info':
                        if (message.queryKey && queries.has(message.queryKey)) {
                            const [resolve, reject] = queries.get(message.queryKey);
                            if (message.type === 'error') {
                                reject(message.error);
                            }
                            else {
                                resolve(message);
                            }
                            queries.delete(message.queryKey);
                        }
                        else if (message.type === 'error') {
                            throw message.error;
                        }
                        break;
                    case 'callback':
                        const userCallback = this.userCallbacks.get(message.name);
                        if (userCallback) {
                            userCallback(...(message.args ?? []));
                        }
                        break;
                }
            }
        });
        Object.defineProperty(this, "createQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (message) => {
                if (this.isWorkerDestroyed === true) {
                    throw new Error('This SQLocal client has been destroyed. You will need to initialize a new client in order to make further queries.');
                }
                const queryKey = getQueryKey();
                switch (message.type) {
                    case 'import':
                        this.worker.postMessage({
                            ...message,
                            queryKey,
                        }, [message.database]);
                        break;
                    default:
                        this.worker.postMessage({
                            ...message,
                            queryKey,
                        });
                        break;
                }
                return new Promise((resolve, reject) => {
                    this.queriesInProgress.set(queryKey, [resolve, reject]);
                });
            }
        });
        Object.defineProperty(this, "exec", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (sql, params, method = 'all', transactionKey) => {
                const message = await this.createQuery({
                    type: 'query',
                    transactionKey,
                    sql,
                    params,
                    method,
                });
                const data = {
                    rows: [],
                    columns: [],
                };
                if (message.type === 'data') {
                    data.rows = message.data[0].rows;
                    data.columns = message.data[0].columns;
                }
                return data;
            }
        });
        Object.defineProperty(this, "execBatch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (statements) => {
                const message = await this.createQuery({
                    type: 'batch',
                    statements,
                });
                const data = new Array(statements.length).fill({
                    rows: [],
                    columns: [],
                });
                if (message.type === 'data') {
                    message.data.forEach((result, resultIndex) => {
                        data[resultIndex] = result;
                    });
                }
                return data;
            }
        });
        Object.defineProperty(this, "sql", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (queryTemplate, ...params) => {
                const statement = normalizeSql(queryTemplate, params);
                const { rows, columns } = await this.exec(statement.sql, statement.params, 'all');
                const resultRecords = convertRowsToObjects(rows, columns);
                return resultRecords;
            }
        });
        Object.defineProperty(this, "batch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (passStatements) => {
                const statements = passStatements(sqlTag);
                const data = await this.execBatch(statements);
                return data.map(({ rows, columns }) => {
                    const resultRecords = convertRowsToObjects(rows, columns);
                    return resultRecords;
                });
            }
        });
        Object.defineProperty(this, "beginTransaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                const transactionKey = getQueryKey();
                await this.createQuery({
                    type: 'transaction',
                    transactionKey,
                    action: 'begin',
                });
                const query = async (passStatement) => {
                    const statement = normalizeStatement(passStatement);
                    const { rows, columns } = await this.exec(statement.sql, statement.params, 'all', transactionKey);
                    const resultRecords = convertRowsToObjects(rows, columns);
                    return resultRecords;
                };
                const sql = async (queryTemplate, ...params) => {
                    const statement = normalizeSql(queryTemplate, params);
                    const resultRecords = await query(statement);
                    return resultRecords;
                };
                const commit = async () => {
                    await this.createQuery({
                        type: 'transaction',
                        transactionKey,
                        action: 'commit',
                    });
                };
                const rollback = async () => {
                    await this.createQuery({
                        type: 'transaction',
                        transactionKey,
                        action: 'rollback',
                    });
                };
                return {
                    query,
                    sql,
                    commit,
                    rollback,
                };
            }
        });
        Object.defineProperty(this, "transaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (transaction) => {
                const tx = await this.beginTransaction();
                try {
                    const result = await transaction({
                        sql: tx.sql,
                        query: tx.query,
                    });
                    await tx.commit();
                    return result;
                }
                catch (err) {
                    await tx.rollback();
                    throw err;
                }
            }
        });
        Object.defineProperty(this, "createCallbackFunction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (funcName, func) => {
                await this.createQuery({
                    type: 'function',
                    functionName: funcName,
                    functionType: 'callback',
                });
                this.userCallbacks.set(funcName, func);
            }
        });
        Object.defineProperty(this, "createScalarFunction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (funcName, func) => {
                await this.createQuery({
                    type: 'function',
                    functionName: funcName,
                    functionType: 'scalar',
                });
                this.proxy[`_sqlocal_func_${funcName}`] = func;
            }
        });
        Object.defineProperty(this, "getDatabaseInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                const message = await this.createQuery({ type: 'getinfo' });
                if (message.type === 'info') {
                    return message.info;
                }
                else {
                    throw new Error('The database failed to return valid information.');
                }
            }
        });
        Object.defineProperty(this, "getDatabaseContent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                const message = await this.createQuery({ type: 'export' });
                if (message.type === 'export') {
                    return message.export.data;
                }
                else {
                    throw new Error('The database failed to return an export.');
                }
            }
        });
        Object.defineProperty(this, "getDatabaseFile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                if (this.config.storage.type === 'memory') {
                    throw new Error('getDatabaseFile not supported for storage type memory');
                }
                const path = this.config.storage.path
                    .split(/[\\/]/)
                    .filter((part) => part !== '');
                const fileName = path.pop();
                if (!fileName) {
                    throw new Error('Failed to parse the database file name.');
                }
                let dirHandle = await navigator.storage.getDirectory();
                for (let dirName of path)
                    dirHandle = await dirHandle.getDirectoryHandle(dirName);
                const fileHandle = await dirHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                return new File([file], fileName, {
                    type: 'application/x-sqlite3',
                });
            }
        });
        Object.defineProperty(this, "overwriteDatabaseFile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (databaseFile) => {
                let database;
                if (databaseFile instanceof Blob) {
                    database = await databaseFile.arrayBuffer();
                }
                else {
                    database = databaseFile;
                }
                await this.createQuery({
                    type: 'import',
                    database,
                });
            }
        });
        Object.defineProperty(this, "destroy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                await this.createQuery({ type: 'destroy' });
                this.worker.removeEventListener('message', this.processMessageEvent);
                this.queriesInProgress.clear();
                this.userCallbacks.clear();
                this.worker.terminate();
                this.isWorkerDestroyed = true;
            }
        });
        config =
            typeof config === 'string'
                ? { storage: { path: config, type: 'opfs' } }
                : config;
        this.worker = new Worker(new URL('./worker', import.meta.url), {
            type: 'module',
        });
        this.worker.addEventListener('message', this.processMessageEvent);
        this.proxy = coincident(this.worker);
        this.config = config;
        this.worker.postMessage({
            type: 'config',
            config,
        });
    }
}
//# sourceMappingURL=client.js.map