import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createPreprocessor } from "../create-preprocessor.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";
import type {
	DeleteStatementNode,
	ExpressionNode,
	IdentifierNode,
	SegmentedStatementNode,
	StatementSegmentNode,
} from "../sql-parser/nodes.js";
import { buildSqliteJsonPath } from "../../../schema-definition/json-pointer.js";
import type { PreprocessorTraceEntry } from "../types.js";

const getDeleteAst = (
	result: Awaited<ReturnType<ReturnType<typeof createPreprocessor>>>
): DeleteStatementNode => {
	const trace = result.trace ?? [];
	const complete = trace.find(
		(entry: PreprocessorTraceEntry) => entry.step === "complete"
	);
	if (!complete?.payload?.ast) {
		throw new Error("expected final AST in trace");
	}
	const statements = complete.payload.ast as readonly SegmentedStatementNode[];
	const segment = statements
		.flatMap(
			(statement) => statement.segments as readonly StatementSegmentNode[]
		)
		.find((node) => node.node_kind === "delete_statement");
	if (!segment || segment.node_kind !== "delete_statement") {
		throw new Error("expected delete statement segment in trace");
	}
	return segment;
};

type EqualityPair = {
	readonly left: ExpressionNode;
	readonly right: ExpressionNode;
};

const collectEqualityExpressions = (
	whereClause: ExpressionNode | null
): EqualityPair[] => {
	if (!whereClause) {
		return [];
	}
	const pairs: EqualityPair[] = [];
	const visit = (expression: ExpressionNode): void => {
		switch (expression.node_kind) {
			case "binary_expression":
				if (expression.operator === "and") {
					visit(expression.left);
					visit(expression.right);
					return;
				}
				if (expression.operator === "=") {
					pairs.push({ left: expression.left, right: expression.right });
					return;
				}
				break;
			case "grouped_expression":
				visit(expression.expression);
				return;
			default:
		}
		throw new Error("unsupported where clause expression shape");
	};
	visit(whereClause);
	return pairs;
};

const isColumnReference = (
	expression: ExpressionNode,
	expectedPath: readonly string[]
) =>
	expression.node_kind === "column_reference" &&
	expression.path
		.map((part: IdentifierNode) => part.value)
		.join(".")
		.toLowerCase() === expectedPath.join(".").toLowerCase();

const isLiteral = (expression: ExpressionNode, value: string) =>
	expression.node_kind === "literal" && String(expression.value) === value;

const isJsonExtractForProperty = (
	expression: ExpressionNode,
	property: string
) => {
	if (expression.node_kind !== "function_call") return false;
	if (expression.name.value.toLowerCase() !== "json_extract") return false;
	if (expression.arguments.length !== 2) return false;
	const firstArg = expression.arguments[0];
	if (!firstArg || firstArg.node_kind !== "column_reference") {
		return false;
	}
	const [tableSegment, columnSegment] = firstArg.path;
	if (!tableSegment || !columnSegment) {
		return false;
	}
	if (
		tableSegment.value.toLowerCase() !== "state_all" ||
		columnSegment.value.toLowerCase() !== "snapshot_content"
	) {
		return false;
	}
	const secondArg = expression.arguments[1];
	return (
		!!secondArg &&
		secondArg.node_kind === "literal" &&
		secondArg.value === buildSqliteJsonPath([property])
	);
};

const equalityMatches = (
	equalities: readonly EqualityPair[],
	predicate: (left: ExpressionNode, right: ExpressionNode) => boolean
) =>
	equalities.some(
		({ left, right }) => predicate(left, right) || predicate(right, left)
	);

const unwrapGroupedExpression = (
	expression: ExpressionNode
): ExpressionNode => {
	let current = expression;
	while (current.node_kind === "grouped_expression") {
		current = current.expression;
	}
	return current;
};

const getOriginalPredicate = (
	whereClause: DeleteStatementNode["where_clause"]
): ExpressionNode | null => {
	if (!whereClause || "sql_text" in whereClause) {
		return null;
	}
	let current: ExpressionNode = whereClause;
	while (
		current.node_kind === "binary_expression" &&
		current.operator === "and"
	) {
		current = unwrapGroupedExpression(current.left);
	}
	return unwrapGroupedExpression(current);
};

test("rewrites deletes for stored schema views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["row-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
		trace: true,
	});

	const ast = getDeleteAst(deleteResult);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");
	const equalities = collectEqualityExpressions(ast.where_clause);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "schema_key"]) &&
				isLiteral(right, "delete_schema")
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isJsonExtractForProperty(left, "id") && right.node_kind === "parameter"
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "version_id"]) &&
				right.node_kind === "subquery_expression"
		)
	).toBe(true);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters,
		preprocessMode: "none",
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
		preprocessMode: "none",
	}).rows;

	expect(rows).toEqual([]);
	await lix.close();
});

test("prefixless alias deletes target stored schema key", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const insertResult = preprocess({
		sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
		parameters: ["alias", JSON.stringify({ foo: "bar" })],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const deleteResult = preprocess({
		sql: "DELETE FROM key_value WHERE key = ?",
		parameters: ["alias"],
		trace: true,
	});

	const ast = getDeleteAst(deleteResult);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");
	const equalities = collectEqualityExpressions(ast.where_clause);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "schema_key"]) &&
				isLiteral(right, "lix_key_value")
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isJsonExtractForProperty(left, "key") && right.node_kind === "parameter"
		)
	).toBe(true);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters,
		preprocessMode: "none",
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
		preprocessMode: "none",
	}).rows;

	expect(rows).toEqual([]);
	await lix.close();
});

test("rewrites deletes for _all views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const table = schema["x-lix-key"];
	const allView = `${table}_all`;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const insertResult = preprocess({
		sql: `INSERT INTO ${allView} (id, name, lixcol_version_id) VALUES (?, ?, ?)`,
		parameters: ["row-2", "Original All", activeVersion.version_id],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${allView} WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["row-2", activeVersion.version_id],
		trace: true,
	});

	const ast = getDeleteAst(deleteResult);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");
	const equalities = collectEqualityExpressions(ast.where_clause);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "schema_key"]) &&
				isLiteral(right, "delete_schema")
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isJsonExtractForProperty(left, "id") && right.node_kind === "parameter"
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "version_id"]) &&
				right.node_kind === "parameter"
		)
	).toBe(true);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters,
		preprocessMode: "none",
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${allView} WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["row-2", activeVersion.version_id],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
		preprocessMode: "none",
	}).rows;

	expect(rows).toEqual([]);
	await lix.close();
});

test("skips rewriting for disabled state_all view", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "limited_delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-entity-views": ["state"] as (
			| "state"
			| "state_all"
			| "state_history"
		)[],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const sql = "DELETE FROM limited_delete_schema_all WHERE id = ?";
	const parameters = ["row-1"];
	const rewritten = preprocess({ sql, parameters, trace: true });

	expect(rewritten.sql).toBe(sql);

	expect(rewritten.parameters).toEqual(parameters);

	await lix.close();
});

test("base-only views apply metadata version defaults on delete", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		"x-lix-entity-views": ["state"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
	const preprocess = createPreprocessor({ engine: lix.engine! });
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["base-del-1", "Delete Me"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${table} WHERE id = ?`,
		parameters: ["base-del-1"],
		trace: true,
	});

	const ast = getDeleteAst(deleteResult);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");
	const equalities = collectEqualityExpressions(ast.where_clause);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "schema_key"]) &&
				isLiteral(right, table)
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "version_id"]) &&
				isLiteral(right, "global")
		)
	).toBe(true);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters,
		preprocessMode: "none",
	});

	const rows = await lix.db
		.selectFrom("state_all")
		.where("schema_key", "=", table)
		.select(["entity_id"] as const)
		.execute();

	expect(rows).toEqual([]);
	await lix.close();
});

test("base view delete uses schema default version when omitted", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["acc-default", "Keep me"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${table} WHERE id = ?`,
		parameters: ["acc-default"],
		trace: true,
	});

	const ast = getDeleteAst(deleteResult);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");
	const equalities = collectEqualityExpressions(ast.where_clause);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "schema_key"]) &&
				isLiteral(right, table)
		)
	).toBe(true);

	expect(
		equalityMatches(
			equalities,
			(left, right) =>
				isColumnReference(left, ["state_all", "version_id"]) &&
				isLiteral(right, "global")
		)
	).toBe(true);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters,
		preprocessMode: "none",
	});

	const rows = await (lix.db as any)
		.selectFrom(table)
		.where("id", "=", "acc-default")
		.selectAll()
		.execute();

	expect(rows).toEqual([]);
	await lix.close();
});

function expectJsonComparison(
	expression: ExpressionNode,
	property: string,
	operator: "=" | ">" | "is"
) {
	const target = unwrapGroupedExpression(expression);
	if (target.node_kind !== "binary_expression") {
		throw new Error(`expected binary expression, received ${target.node_kind}`);
	}
	expect(target.operator).toBe(operator);
	const { left, right } = target;
	expect(
		isJsonExtractForProperty(left, property) ||
			isJsonExtractForProperty(right, property)
	).toBe(true);
}

test("rewrites delete with OR predicates", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const viewName = schema["x-lix-key"];

	const rewritten = preprocess({
		sql: `DELETE FROM ${viewName} WHERE id = ? OR name = ?`,
		parameters: ["row-1", "Alice"],
		trace: true,
	});

	const ast = getDeleteAst(rewritten);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");

	const trace = rewritten.trace ?? [];
	expect(
		trace.filter(
			(entry: PreprocessorTraceEntry) =>
				entry.step === "rewrite_entity_view_delete"
		)
	).toHaveLength(1);

	const predicate = getOriginalPredicate(ast.where_clause);
	if (!predicate || predicate.node_kind !== "binary_expression") {
		throw new Error("expected OR predicate to remain a binary expression");
	}
	expect(predicate.operator).toBe("or");
	expectJsonComparison(predicate.left, "id", "=");
	expectJsonComparison(predicate.right, "name", "=");

	await lix.close();
});

test("rewrites delete with NOT predicates", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const viewName = schema["x-lix-key"];

	const rewritten = preprocess({
		sql: `DELETE FROM ${viewName} WHERE NOT (id = ?)`,
		parameters: ["row-1"],
		trace: true,
	});

	const ast = getDeleteAst(rewritten);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");

	const trace = rewritten.trace ?? [];
	expect(
		trace.filter(
			(entry: PreprocessorTraceEntry) =>
				entry.step === "rewrite_entity_view_delete"
		)
	).toHaveLength(1);

	const predicate = getOriginalPredicate(ast.where_clause);
	if (!predicate || predicate.node_kind !== "unary_expression") {
		throw new Error("expected NOT predicate to remain unary");
	}
	expect(predicate.operator).toBe("not");
	expectJsonComparison(predicate.operand, "id", "=");

	await lix.close();
});

test("rewrites delete with inequality predicates", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const viewName = schema["x-lix-key"];

	const rewritten = preprocess({
		sql: `DELETE FROM ${viewName} WHERE id > ?`,
		parameters: ["row-1"],
		trace: true,
	});

	const ast = getDeleteAst(rewritten);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");

	const trace = rewritten.trace ?? [];
	expect(
		trace.filter(
			(entry: PreprocessorTraceEntry) =>
				entry.step === "rewrite_entity_view_delete"
		)
	).toHaveLength(1);

	const predicate = getOriginalPredicate(ast.where_clause);
	if (!predicate || predicate.node_kind !== "binary_expression") {
		throw new Error("expected inequality predicate to remain binary");
	}
	expectJsonComparison(predicate, "id", ">");

	await lix.close();
});

test("rewrites delete with IS NULL predicates", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const viewName = schema["x-lix-key"];

	const rewritten = preprocess({
		sql: `DELETE FROM ${viewName} WHERE name IS NULL`,
		parameters: [],
		trace: true,
	});

	const ast = getDeleteAst(rewritten);
	expect(ast.target.name.parts[0]?.value).toBe("state_all");

	const trace = rewritten.trace ?? [];
	expect(
		trace.filter(
			(entry: PreprocessorTraceEntry) =>
				entry.step === "rewrite_entity_view_delete"
		)
	).toHaveLength(1);

	const predicate = getOriginalPredicate(ast.where_clause);
	if (!predicate || predicate.node_kind !== "binary_expression") {
		throw new Error("expected IS predicate to produce binary expression");
	}
	expectJsonComparison(predicate, "name", "is");

	await lix.close();
});
