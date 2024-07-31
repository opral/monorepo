import type { Statement } from '../types.js';
export declare function normalizeSql(maybeQueryTemplate: TemplateStringsArray | string, params: unknown[]): Statement;
