import type { SelectQueryBuilder } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import { LixObservable } from "./lix-observable.js";

/**
 * Options for the observe method.
 */
export interface ObserveOptions {
	mode?: "array" | "first" | "firstOrThrow";
}

/**
 * Map to track active observables and their cleanup functions.
 */
interface ActiveObservable {
	unsubscribeFromStateCommit: () => void;
}

/**
 * Deep equality check for query results.
 * Compares arrays element by element using JSON.stringify for simplicity.
 */
function areResultsEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false;

	// Simple deep equality using JSON.stringify
	// This works well for database results which are typically JSON-serializable
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Maps table names to their corresponding schema keys.
 * This is the reverse mapping of what's done in schema.ts.
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

	// Map table names to schema keys
	const tableToSchemaMap: Record<string, string> = {
		key_value: "lix_key_value",
		version: "lix_version",
		change_set: "lix_change_set",
		file: "lix_file",
		account: "lix_account",
		label: "lix_label",
		thread: "lix_thread",
		thread_comment: "lix_thread_comment",
		change_author: "lix_change_author",
		log: "lix_log",
		stored_schema: "lix_stored_schema",
		change_set_element: "lix_change_set_element",
		change_set_edge: "lix_change_set_edge",
		change_set_label: "lix_change_set_label",
		change_set_thread: "lix_change_set_thread",
		// Add special tables that don't have direct schema mappings but are important
		change: "change", // Special case for change table
		state: "state", // Virtual state table - could include multiple schema keys
		active_version: "lix_version", // Maps to version schema
		active_account: "lix_account", // Maps to account schema
	};

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

/**
 * Creates the observe function for a Lix instance.
 *
 * @param lix - The Lix instance to add observables to
 * @returns The observe function
 */
export function createObserve(lix: Pick<Lix, "hooks">) {
	const activeObservables = new WeakMap<LixObservable<any>, ActiveObservable>();

	/**
	 * Converts a **Kysely read-query** into a **LixObservable** – an implementation of
	 * the TC-39 Observable protocol that emits a fresh result-set every time the
	 * underlying state mutates.
	 *
	 * @example **Full table stream**
	 * ```ts
	 * observe(
	 *   lix.db.selectFrom('key_value').selectAll()
	 * ).subscribe({
	 *   next: rows => console.table(rows)
	 * })
	 * ```
	 *
	 * @example **Watch latest change-set (first row)**
	 * ```ts
	 * observe(
	 *   lix.db.selectFrom('change_set_all')
	 *         .selectAll()
	 *         .orderBy('created_at desc')
	 * ).subscribeTakeFirst({
	 *   next: cs => console.log('head →', cs)
	 * })
	 * ```
	 */
	return function observe<T>(
		query: SelectQueryBuilder<any, any, T>,
		options: ObserveOptions = { mode: "array" }
	): LixObservable<T> {
		// Create the observable
		const observable = new LixObservable<T>((observer) => {
			let isActive = true;
			let previousResult: T[] | undefined;

			// Helper to execute the query
			const executeQuery = async () => {
				if (!isActive) return;

				try {
					// Optimize query for first/firstOrThrow modes
					let optimizedQuery = query;
					if (options.mode === "first" || options.mode === "firstOrThrow") {
						// Add limit(1) if we only need the first row
						optimizedQuery = query.limit(1) as any;
					}

					// Execute the query
					const result = await optimizedQuery.execute();

					if (!isActive) return;

					// Check if results have changed
					const hasChanged =
						!previousResult || !areResultsEqual(previousResult, result as T[]);

					if (hasChanged) {
						previousResult = result as T[];

						// Handle different modes
						if (options.mode === "first") {
							observer.next?.(result as T[]);
						} else if (options.mode === "firstOrThrow") {
							observer.next?.(result as T[]);
						} else {
							// Default: array mode
							observer.next?.(result as T[]);
						}
					}
				} catch (error) {
					if (!isActive) return;
					observer.error?.(error);
				}
			};

			// Execute initial query
			executeQuery();

			const shouldReexecute = (data: any) => {
				// Extract changes from the data structure
				const changes = data.changes || [];

				// If no changes provided, always re-execute for safety
				if (!changes || changes.length === 0) {
					return true;
				}

				// Get schema keys that this query depends on
				const schemaKeys = determineSchemaKeys(query.compile());
				// If no schema keys extracted, always re-execute for safety
				if (!schemaKeys.length) {
					return true;
				}

				// Check if any of the changed entities match our query's schema keys
				return changes.some((change: any) => {
					// changesToRealize is an array of arrays: [change_id, entity_id, schema_key, ...]
					const schemaKey = change[2];

					// Special case: queries with 'change' schema should always re-execute
					if (schemaKeys.includes("change")) {
						return true;
					}

					// Check if this specific schema key affects our query
					return schemaKeys.includes(schemaKey);
				});
			};

			// Subscribe to state commits for updates
			const unsubscribeFromStateCommit = lix.hooks.onStateCommit((data) => {
				if (shouldReexecute(data)) {
					executeQuery();
				}
			});

			// Store the cleanup function
			activeObservables.set(observable, { unsubscribeFromStateCommit });

			// Return cleanup function
			return () => {
				isActive = false;
				unsubscribeFromStateCommit();
				activeObservables.delete(observable);
			};
		});

		// Handle mode-specific behavior by returning wrapped observables
		if (options.mode === "first") {
			// For compatibility, we still return the base observable
			// The subscribeTakeFirst method handles the transformation
			return observable;
		} else if (options.mode === "firstOrThrow") {
			// For compatibility, we still return the base observable
			// The subscribeTakeFirstOrThrow method handles the transformation
			return observable;
		}

		return observable;
	};
}
