import { LixSchemaViewMap } from "../database/schema-view-map.js";

/**
 * Maps table names to their corresponding schema keys.
 * Uses LixSchemaViewMap to derive the mappings dynamically.
 */
export function determineSchemaKeys(compiledQuery: any): string[] {
	const tableNames = new Set<string>();

	// Extract table names from the compiled query
	try {
		// The compiled query has a 'query' property that contains the actual AST
		const queryNode = compiledQuery.query || compiledQuery;

		// Get table names from FROM clause
		if (queryNode.from) {
			extractTableNamesFromQueryNode(queryNode.from, tableNames);
		}

		// Get table names from JOIN clauses
		if (queryNode.joins) {
			for (const join of queryNode.joins) {
				extractTableNamesFromQueryNode(join, tableNames);
			}
		}

		// Get table names from WHERE clause subqueries
		if (queryNode.where) {
			extractTableNamesFromQueryNode(queryNode.where, tableNames);
		}

		// Get table names from SELECT clause subqueries
		if (queryNode.selections) {
			for (const selection of queryNode.selections) {
				extractTableNamesFromQueryNode(selection, tableNames);
			}
		}
	} catch (error) {
		console.warn("Failed to extract table names from compiled query:", error);
		return []; // Return empty array to fall back to always re-executing
	}

	// Build table to schema key mapping from LixSchemaViewMap
	const tableToSchemaMap: Record<string, string> = {};

	// Add mappings from LixSchemaViewMap
	for (const [schemaKey, schemaDefinition] of Object.entries(
		LixSchemaViewMap
	)) {
		const lixKey = schemaDefinition["x-lix-key"];
		if (lixKey) {
			tableToSchemaMap[schemaKey] = lixKey;
		}
	}

	// Add special tables/views that don't come from LixSchemaViewMap
	const specialMappings = {
		change: "change",
		state: "state",
		state_by_version: "state_by_version",
		version: "lix_version",
		active_version: "lix_active_version",
	} as const;

	Object.assign(tableToSchemaMap, specialMappings);

	const schemaKeys: string[] = [];
	for (const tableName of tableNames) {
		const schemaKey = tableToSchemaMap[tableName];
		if (schemaKey) {
			schemaKeys.push(schemaKey);
		}
	}

	// Special case: the merged 'version' views are composed from descriptor + tip state
	// Changes to those underlying schema keys should invalidate queries against 'version'.
	if (tableNames.has("version") || tableNames.has("version_by_version")) {
		if (!schemaKeys.includes("lix_version_descriptor"))
			schemaKeys.push("lix_version_descriptor");
		if (!schemaKeys.includes("lix_version_tip"))
			schemaKeys.push("lix_version_tip");
	}

	// Try to detect literal schema_key filters from the compiled SQL and parameters.
	// This allows more precise dependency tracking for state_by_version queries.
	const sqlText: string | undefined = (compiledQuery?.sql ??
		compiledQuery?.query?.sql) as any;
	const params: any[] = (compiledQuery?.parameters ??
		compiledQuery?.query?.parameters) as any[];
	if (typeof sqlText === "string" && Array.isArray(params)) {
		const lower = sqlText.toLowerCase();
		const idx = lower.indexOf("schema_key");
		if (idx >= 0) {
			// Count placeholders up to and including first occurrence of schema_key equality
			// This assumes placeholders are '?'.
			const before = lower.slice(0, idx);
			const qCount = (before.match(/\?/g) || []).length;
			// Look ahead for the first '?' after schema_key reference
			const after = lower.slice(idx);
			const aheadQIndex = after.indexOf("?");
			if (aheadQIndex >= 0) {
				const paramIndex = qCount; // parameter index of that placeholder
				const val = params[paramIndex];
				if (typeof val === "string" && !schemaKeys.includes(val)) {
					schemaKeys.push(val);
				}
			}
		}
	}

	return schemaKeys;
}

/**
 * Extracts literal `schema_key`, `entity_id`, and `version_id` filters from a compiled query AST.
 */
export function extractLiteralFilters(compiledQuery: any): {
	schemaKeys: string[];
	versionIds: string[];
	entityIds: string[];
} {
	const schemaKeys = new Set<string>();
	const versionIds = new Set<string>();
	const entityIds = new Set<string>();

	const root = compiledQuery?.query ?? compiledQuery;
	if (!root) {
		return { schemaKeys: [], versionIds: [], entityIds: [] };
	}

	const record = (column: string | undefined, values: string[] | undefined) => {
		if (!column || !values || values.length === 0) return;
		const target =
			column === "schema_key"
				? schemaKeys
				: column === "version_id"
					? versionIds
					: column === "entity_id"
						? entityIds
						: undefined;
		if (!target) return;
		for (const value of values) {
			if (typeof value === "string") {
				target.add(value);
			}
		}
	};

	const visitFilterNode = (node: any): void => {
		if (!node) return;
		switch (node.kind) {
			case "WhereNode":
				visitFilterNode(node.where);
				return;
			case "HavingNode":
				visitFilterNode(node.having);
				return;
			case "OnNode":
				visitFilterNode(node.on);
				return;
			case "ParensNode":
				visitFilterNode(node.node);
				return;
			case "AndNode":
			case "OrNode":
				visitFilterNode(node.left);
				visitFilterNode(node.right);
				return;
			case "UnaryOperationNode":
				visitFilterNode(node.operand);
				return;
			case "BinaryOperationNode": {
				const operator = node.operator?.operator ?? node.operator;
				const leftColumn = extractColumnName(node.leftOperand);
				const rightColumn = extractColumnName(node.rightOperand);
				const leftValues = extractLiteralValues(node.leftOperand);
				const rightValues = extractLiteralValues(node.rightOperand);

				if (
					leftColumn === "schema_key" ||
					leftColumn === "version_id" ||
					leftColumn === "entity_id"
				) {
					record(leftColumn, rightValues);
				}
				if (
					rightColumn === "schema_key" ||
					rightColumn === "version_id" ||
					rightColumn === "entity_id"
				) {
					record(rightColumn, leftValues);
				}

				// For IN/NOT IN operators, both sides can carry literals. Already handled above.

				// Dive deeper in case operands contain additional filters (e.g. nested expressions)
				if (operator === "in" || operator === "not in") {
					// Operands already processed.
				}
				visitFilterNode(node.leftOperand);
				visitFilterNode(node.rightOperand);
				return;
			}
			case "ValueListNode":
			case "TupleNode":
			case "ListNode":
				for (const value of node.values ?? node.items ?? []) {
					visitFilterNode(value);
				}
				return;
			default:
				if (Array.isArray(node)) {
					for (const child of node) visitFilterNode(child);
					return;
				}
		}
	};

	const extractLiteralValues = (node: any): string[] | undefined => {
		if (!node) return undefined;
		switch (node.kind) {
			case "ValueNode": {
				const value = unwrapValue(node.value);
				return value !== undefined ? [value] : undefined;
			}
			case "PrimitiveValueListNode": {
				const values: string[] = [];
				for (const v of node.values ?? []) {
					if (typeof v === "string") values.push(v);
				}
				return values.length > 0 ? values : undefined;
			}
			case "ValueListNode": {
				const values: string[] = [];
				for (const child of node.values ?? []) {
					const nested = extractLiteralValues(child);
					if (nested) values.push(...nested);
				}
				return values.length > 0 ? values : undefined;
			}
			case "TupleNode": {
				const values: string[] = [];
				for (const child of node.values ?? []) {
					const nested = extractLiteralValues(child);
					if (nested) values.push(...nested);
				}
				return values.length > 0 ? values : undefined;
			}
			case "ParensNode":
				return extractLiteralValues(node.node);
			default:
				return undefined;
		}
	};

	const unwrapValue = (value: unknown): string | undefined => {
		if (typeof value === "string") return value;
		if (
			value &&
			typeof value === "object" &&
			"value" in (value as any) &&
			typeof (value as any).value === "string"
		) {
			return (value as any).value as string;
		}
		return undefined;
	};

	const extractColumnName = (node: any): string | undefined => {
		if (!node) return undefined;
		switch (node.kind) {
			case "ReferenceNode":
				return extractColumnName(node.column);
			case "ColumnNode":
				return extractColumnName(node.column);
			case "IdentifierNode":
				return typeof node.name === "string" ? node.name : undefined;
			case "AliasNode":
				return extractColumnName(node.node);
			case "ParensNode":
				return extractColumnName(node.node);
			default:
				return undefined;
		}
	};

	const queryNode = root?.query ?? root;
	if (queryNode?.where) visitFilterNode(queryNode.where);
	if (queryNode?.having) visitFilterNode(queryNode.having);
	if (queryNode?.joins) {
		for (const join of queryNode.joins) {
			if (join?.on) visitFilterNode(join.on);
		}
	}

	return {
		schemaKeys: Array.from(schemaKeys),
		versionIds: Array.from(versionIds),
		entityIds: Array.from(entityIds),
	};
}

/**
 * Extracts table names from Kysely AST nodes recursively.
 */
function extractTableNamesFromQueryNode(
	node: any,
	tableNames: Set<string>
): void {
	if (!node) return;

	// Handle different Kysely AST node types
	switch (node.kind) {
		case "TableNode": {
			// Extract table name from TableNode
			if (node.table && node.table.identifier && node.table.identifier.name) {
				tableNames.add(node.table.identifier.name);
			}
			break;
		}

		case "FromNode": {
			// Process all tables in FROM clause
			if (node.froms && Array.isArray(node.froms)) {
				for (const from of node.froms) {
					extractTableNamesFromQueryNode(from, tableNames);
				}
			}
			break;
		}

		case "JoinNode": {
			// Process the joined table
			if (node.table) {
				extractTableNamesFromQueryNode(node.table, tableNames);
			}
			break;
		}

		case "SelectQueryNode": {
			// Process subqueries recursively
			if (node.from) {
				extractTableNamesFromQueryNode(node.from, tableNames);
			}
			if (node.joins) {
				for (const join of node.joins) {
					extractTableNamesFromQueryNode(join, tableNames);
				}
			}
			if (node.where) {
				extractTableNamesFromQueryNode(node.where, tableNames);
			}
			if (node.selections) {
				for (const selection of node.selections) {
					extractTableNamesFromQueryNode(selection, tableNames);
				}
			}
			break;
		}

		case "AliasNode": {
			// Look inside the aliased node
			if (node.node) {
				extractTableNamesFromQueryNode(node.node, tableNames);
			}
			break;
		}

		default: {
			// For other node types, recursively check all properties
			if (typeof node === "object") {
				for (const key in node) {
					const value = node[key];
					if (value && typeof value === "object") {
						if (Array.isArray(value)) {
							for (const item of value) {
								if (item && typeof item === "object" && item.kind) {
									extractTableNamesFromQueryNode(item, tableNames);
								}
							}
						} else if (value.kind) {
							extractTableNamesFromQueryNode(value, tableNames);
						}
					}
				}
			}
			break;
		}
	}
}
