import type { CallbackUserFunction, DestroyMessage, FunctionMessage, ImportMessage, OmitQueryKey, OutputMessage, QueryKey, QueryMessage, RawResultData, Sqlite3Method, BatchMessage, WorkerProxy, ScalarUserFunction, GetInfoMessage, Statement, DatabaseInfo, ClientConfig, TransactionMessage, Transaction, ExportMessage } from './types.js';
import { sqlTag } from './lib/sql-tag.js';
export declare class SQLocal {
    protected config: ClientConfig;
    protected worker: Worker;
    protected proxy: WorkerProxy;
    protected isWorkerDestroyed: boolean;
    protected userCallbacks: Map<string, (...args: any[]) => void>;
    protected queriesInProgress: Map<string, [resolve: (message: OutputMessage) => void, reject: (error: unknown) => void]>;
    constructor(databasePath: string);
    constructor(config: ClientConfig);
    protected processMessageEvent: (event: MessageEvent<OutputMessage>) => void;
    protected createQuery: (message: OmitQueryKey<QueryMessage | BatchMessage | TransactionMessage | DestroyMessage | FunctionMessage | ExportMessage | ImportMessage | GetInfoMessage>) => Promise<OutputMessage>;
    protected exec: (sql: string, params: unknown[], method?: Sqlite3Method, transactionKey?: QueryKey) => Promise<RawResultData>;
    protected execBatch: (statements: Statement[]) => Promise<RawResultData[]>;
    sql: <Result extends Record<string, any>>(queryTemplate: TemplateStringsArray | string, ...params: unknown[]) => Promise<Result[]>;
    batch: <Result extends Record<string, any>>(passStatements: (sql: typeof sqlTag) => Statement[]) => Promise<Result[][]>;
    beginTransaction: () => Promise<Transaction>;
    transaction: <Result>(transaction: (tx: {
        sql: Transaction["sql"];
        query: Transaction["query"];
    }) => Promise<Result>) => Promise<Result>;
    createCallbackFunction: (funcName: string, func: CallbackUserFunction["func"]) => Promise<void>;
    createScalarFunction: (funcName: string, func: ScalarUserFunction["func"]) => Promise<void>;
    getDatabaseInfo: () => Promise<DatabaseInfo>;
    getDatabaseContent: () => Promise<Uint8Array>;
    getDatabaseFile: () => Promise<File>;
    overwriteDatabaseFile: (databaseFile: File | Blob | ArrayBuffer | Uint8Array) => Promise<void>;
    destroy: () => Promise<void>;
}
