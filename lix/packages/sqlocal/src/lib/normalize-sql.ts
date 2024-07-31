import type { Statement } from '../types.js';
import { sqlTag } from './sql-tag.js';

export function normalizeSql(
	maybeQueryTemplate: TemplateStringsArray | string,
	params: unknown[]
): Statement {
	let statement: Statement;

	if (typeof maybeQueryTemplate === 'string') {
		statement = { sql: maybeQueryTemplate, params };
	} else {
		statement = sqlTag(maybeQueryTemplate, ...params);
	}

	return statement;
}
