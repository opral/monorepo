export function execOnDb(db, statement) {
    const statementData = {
        rows: [],
        columns: [],
    };
    const rows = db.exec({
        sql: statement.sql,
        bind: statement.params,
        returnValue: 'resultRows',
        rowMode: 'array',
        columnNames: statementData.columns,
    });
    switch (statement.method) {
        case 'run':
            break;
        case 'get':
            statementData.rows = rows[0];
            break;
        case 'all':
        default:
            statementData.rows = rows;
            break;
    }
    return statementData;
}
//# sourceMappingURL=exec-on-db.js.map