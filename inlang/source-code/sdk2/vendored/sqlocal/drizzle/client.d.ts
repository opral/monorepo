import { SQLocal } from '../index.js';
import type { RawResultData, Sqlite3Method } from '../types.js';
export declare class SQLocalDrizzle extends SQLocal {
    driver: (sql: string, params: unknown[], method: Sqlite3Method) => Promise<RawResultData>;
    batchDriver: (queries: {
        sql: string;
        params: unknown[];
        method: Sqlite3Method;
    }[]) => Promise<RawResultData[]>;
}
