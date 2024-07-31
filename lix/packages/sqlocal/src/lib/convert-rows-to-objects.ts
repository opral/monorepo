function isArrayOfArrays(rows: unknown[] | unknown[][]): rows is unknown[][] {
	return !rows.some((row) => !Array.isArray(row));
}

export function convertRowsToObjects(
	rows: unknown[] | unknown[][],
	columns: string[]
): Record<string, unknown>[] {
	let checkedRows: unknown[][];

	if (isArrayOfArrays(rows)) {
		checkedRows = rows;
	} else {
		checkedRows = [rows];
	}

	return checkedRows.map((row) => {
		const rowObj = {} as Record<string, unknown>;
		columns.forEach((column, columnIndex) => {
			rowObj[column] = row[columnIndex];
		});

		return rowObj;
	});
}
