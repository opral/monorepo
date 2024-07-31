import { SQLocal } from '../index.js';
export class SQLocalDrizzle extends SQLocal {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "driver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (sql, params, method) => {
                if (/^begin\b/i.test(sql)) {
                    console.warn("Drizzle's transaction method cannot isolate transactions from outside queries. It is recommended to use the transaction method of SQLocalDrizzle instead (See https://sqlocal.dallashoffman.com/api/transaction#drizzle).");
                }
                return await this.exec(sql, params, method);
            }
        });
        Object.defineProperty(this, "batchDriver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (queries) => {
                return await this.execBatch(queries);
            }
        });
    }
}
//# sourceMappingURL=client.js.map