import { isSQLWrapper } from 'drizzle-orm';
import { sqlTag } from './sql-tag.js';
function isDrizzleStatement(statement) {
    return isSQLWrapper(statement);
}
function isStatement(statement) {
    return (typeof statement === 'object' &&
        statement !== null &&
        'sql' in statement === true &&
        typeof statement.sql === 'string' &&
        'params' in statement === true);
}
export function normalizeStatement(statement) {
    if (typeof statement === 'function') {
        statement = statement(sqlTag);
    }
    if (isDrizzleStatement(statement)) {
        if ('toSQL' in statement && typeof statement.toSQL === 'function') {
            const drizzleStatement = statement.toSQL();
            if (isStatement(drizzleStatement)) {
                return drizzleStatement;
            }
            else {
                throw new Error('The passed Drizzle statement could not be parsed.');
            }
        }
        else {
            throw new Error('The passed statement could not be parsed.');
        }
    }
    const sql = statement.sql;
    let params = [];
    if ('params' in statement) {
        params = statement.params;
    }
    else if ('parameters' in statement) {
        params = statement.parameters;
    }
    return { sql, params };
}
//# sourceMappingURL=normalize-statement.js.map