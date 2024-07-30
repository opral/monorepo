function isArrayOfArrays(rows) {
    return !rows.some((row) => !Array.isArray(row));
}
export function convertRowsToObjects(rows, columns) {
    let checkedRows;
    if (isArrayOfArrays(rows)) {
        checkedRows = rows;
    }
    else {
        checkedRows = [rows];
    }
    return checkedRows.map((row) => {
        const rowObj = {};
        columns.forEach((column, columnIndex) => {
            rowObj[column] = row[columnIndex];
        });
        return rowObj;
    });
}
//# sourceMappingURL=convert-rows-to-objects.js.map