import { LixSchemaViewMap } from "../database/schema.js";

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
		state_all: "state_all",
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
	if (tableNames.has("version") || tableNames.has("version_all")) {
		if (!schemaKeys.includes("lix_version_descriptor"))
			schemaKeys.push("lix_version_descriptor");
		if (!schemaKeys.includes("lix_version_tip"))
			schemaKeys.push("lix_version_tip");
	}

	// Try to detect literal schema_key filters from the compiled SQL and parameters.
	// This allows more precise dependency tracking for state_all queries.
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
 * Extracts literal filters from a compiled Kysely query.
 * Currently detects:
 * - schema_key equality against a single placeholder
 * - version_id equality against a single placeholder
 */
export function extractLiteralFilters(compiledQuery: any): {
	schemaKeys: string[];
	versionIds: string[];
} {
	const result = { schemaKeys: [] as string[], versionIds: [] as string[] };
	const sqlText: string | undefined = (compiledQuery?.sql ??
		compiledQuery?.query?.sql) as any;
	const params: any[] = (compiledQuery?.parameters ??
		compiledQuery?.query?.parameters) as any[];
	if (typeof sqlText !== "string" || !Array.isArray(params)) return result;
	const lower = sqlText.toLowerCase();

	const pushParamAfterKey = (key: string, sink: string[]) => {
		const idx = lower.indexOf(key);
		if (idx < 0) return;
		const before = lower.slice(0, idx);
		const qCount = (before.match(/\?/g) || []).length;
		const after = lower.slice(idx);
		const aheadQIndex = after.indexOf("?");
		if (aheadQIndex >= 0) {
			const paramIndex = qCount; // first '?' after key occurrence
			const val = params[paramIndex];
			if (typeof val === "string" && !sink.includes(val)) sink.push(val);
		}
	};

	pushParamAfterKey("schema_key", result.schemaKeys);
	pushParamAfterKey("version_id", result.versionIds);
	return result;
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
