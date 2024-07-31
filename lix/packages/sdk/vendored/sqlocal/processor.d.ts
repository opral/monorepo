import type { DestroyMessage, QueryMessage, Sqlite3, Sqlite3Db, BatchMessage, ProcessorConfig, FunctionMessage, UserFunction, OutputMessage, InputMessage, ImportMessage, WorkerProxy, GetInfoMessage, Sqlite3StorageType, ConfigMessage, QueryKey, TransactionMessage, ExportMessage } from './types.js';
export declare class SQLocalProcessor {
    protected sqlite3: Sqlite3 | undefined;
    protected db: Sqlite3Db | undefined;
    protected dbStorageType: Sqlite3StorageType | undefined;
    protected config: ProcessorConfig;
    protected userFunctions: Map<string, UserFunction>;
    protected initMutex: {
        lock: () => Promise<void>;
        unlock: () => Promise<void>;
    };
    protected transactionMutex: {
        lock: () => Promise<void>;
        unlock: () => Promise<void>;
    };
    protected transactionKey: QueryKey | null;
    protected proxy: WorkerProxy;
    onmessage: ((message: OutputMessage) => void) | undefined;
    constructor(worker: typeof globalThis);
    protected init: () => Promise<void>;
    postMessage: (message: InputMessage | MessageEvent<InputMessage>) => Promise<void>;
    protected emitMessage: (message: OutputMessage) => void;
    protected editConfig: (message: ConfigMessage) => void;
    protected exec: (message: QueryMessage | BatchMessage | TransactionMessage) => Promise<void>;
    protected getDatabaseInfo: (message: GetInfoMessage) => Promise<void>;
    protected getDatabaseExport: (message: ExportMessage) => Promise<void>;
    protected createUserFunction: (message: FunctionMessage) => void;
    protected initUserFunction: (fn: UserFunction) => void;
    protected importDb: (message: ImportMessage) => Promise<void>;
    protected destroy: (message?: DestroyMessage) => void;
}
