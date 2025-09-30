import { analyzeShape } from "./microparser/analyze-shape.js";
import { rewriteInternalStateVtableQuery } from "./recipes/rewrite-internal-state-vtable.js";
import { tokenize } from "./tokenizer.js";

export function rewriteSql(sql: string): string {
  const tokens = tokenize(sql);
  const shape = analyzeShape(tokens);
  if (!shape) {
    return sql;
  }

  const replacementSql = rewriteInternalStateVtableQuery(shape);
  if (!replacementSql) {
    return sql;
  }

  const aliasSql = shape.table.aliasSql ?? shape.table.alias;
  const wrapped = `(${replacementSql}) AS ${aliasSql}`;
  const start = shape.table.start;
  const end = shape.table.end;

  return sql.slice(0, start) + wrapped + sql.slice(end + 1);
}
