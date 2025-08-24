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

	// Add special tables that don't have direct schema mappings but are important
	const specialMappings = {
		change: "change", // Special case for change table
		state: "state", // Virtual state table - could include multiple schema keys
		state_all: "state_all", // Virtual state_all table - includes all versions
	};

	Object.assign(tableToSchemaMap, specialMappings);

	const schemaKeys: string[] = [];
	for (const tableName of tableNames) {
		const schemaKey = tableToSchemaMap[tableName];
		if (schemaKey) {
			schemaKeys.push(schemaKey);
		}
	}

	return schemaKeys;
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
