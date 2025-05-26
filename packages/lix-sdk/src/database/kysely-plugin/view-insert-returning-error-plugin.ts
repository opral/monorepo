import type {
	KyselyPlugin,
	PluginTransformQueryArgs,
	PluginTransformResultArgs,
	QueryResult,
	RootOperationNode,
	UnknownRow,
} from "kysely";

/**
 * A Kysely plugin that prevents using `returning()` or `returningAll()` 
 * with INSERT operations on database views.
 * 
 * This provides better developer experience by failing fast with clear 
 * error messages instead of letting SQLite return cryptic errors.
 */
export class ViewInsertReturningErrorPlugin implements KyselyPlugin {
	private readonly viewNames: Set<string>;

	constructor(viewNames: string[]) {
		this.viewNames = new Set(viewNames);
	}

	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		const { node } = args;

		// Check if this is an INSERT operation
		if (node.kind === "InsertQueryNode") {
			const tableName = node.into?.table.identifier.name;
			
			// Check if inserting into a view and has returning clause
			if (tableName && this.viewNames.has(tableName) && node.returning) {
				throw new Error(
					`Cannot use returning() or returningAll() with INSERT operations on view '${tableName}'. ` +
					`Views do not support returning clauses in INSERT statements. ` +
					`Use a separate SELECT query after the INSERT to retrieve the data.`
				);
			}
		}

		return node;
	}

	async transformResult(
		args: PluginTransformResultArgs
	): Promise<QueryResult<UnknownRow>> {
		return args.result;
	}
}