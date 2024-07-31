import { Statement } from '../types.js';

export function sqlTag(
	queryTemplate: TemplateStringsArray,
	...params: unknown[]
): Statement {
	return {
		sql: queryTemplate.join('?'),
		params,
	};
}
