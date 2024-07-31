import { RawResultData, Sqlite3Db, Sqlite3Method } from '../types.js';
export declare function execOnDb(db: Sqlite3Db, statement: {
    sql: string;
    params: any[];
    method?: Sqlite3Method;
}): RawResultData;
