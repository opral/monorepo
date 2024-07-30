import { sqlTag } from './sql-tag.js';
export function normalizeSql(maybeQueryTemplate, params) {
    let statement;
    if (typeof maybeQueryTemplate === 'string') {
        statement = { sql: maybeQueryTemplate, params };
    }
    else {
        statement = sqlTag(maybeQueryTemplate, ...params);
    }
    return statement;
}
//# sourceMappingURL=normalize-sql.js.map