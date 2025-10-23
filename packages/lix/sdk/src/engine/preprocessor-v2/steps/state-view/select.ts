import {
	AliasNode,
	IdentifierNode,
	SelectQueryNode,
	TableNode,
	FromNode,
	type OperationNode,
	type RootOperationNode,
	type SchemableIdentifierNode,
} from "kysely";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../../types.js";
import { internalQueryBuilder } from "../../../internal-query-builder.js";

/**
 * Rewrites references to the public `state` view so callers read from the
 * rewritten `state_all` representation while preserving the active-version
 * filter the legacy view enforced.
 */
export const rewriteStateViewSelect: PreprocessorStep = ({ node, trace }) => {
	if (!SelectQueryNode.is(node)) {
		return node;
	}

	const references: StateReference[] = [];
	const rewritten = rewriteSelectNode(node, references);

	if (references.length === 0) {
		return rewritten;
	}

	trace?.push(buildTraceEntry(references));
	return rewritten;
};

interface StateReference {
	readonly binding: string;
}

type RewriteOutcome = {
	operation: OperationNode;
	changed: boolean;
};

function rewriteSelectNode(
	select: SelectQueryNode,
	references: StateReference[]
): SelectQueryNode {
	let mutated = false;

	const rewriteOperation = (operation: OperationNode): OperationNode => {
		const { operation: rewritten, changed } = rewriteRelation(
			operation,
			references
		);
		if (changed) {
			mutated = true;
		}
		return rewritten;
	};

	let from = select.from;
	if (from?.froms) {
		const rewrittenFroms = from.froms.map(rewriteOperation);
		if (mutated) {
			from = FromNode.create(rewrittenFroms);
		}
	}

	let joins = select.joins;
	if (joins && joins.length > 0) {
		let joinMutated = false;
		const rewrittenJoins = joins.map((join) => {
			const { operation, changed } = rewriteRelation(join.table, references);
			if (!changed) {
				return join;
			}
			joinMutated = true;
			return Object.freeze({
				...join,
				table: operation,
			});
		});
		if (joinMutated) {
			mutated = true;
			joins = Object.freeze(rewrittenJoins);
		}
	}

	if (!mutated) {
		return select;
	}

	return Object.freeze({
		...select,
		from,
		joins,
	});
}

function rewriteRelation(
	node: OperationNode,
	references: StateReference[]
): RewriteOutcome {
	if (AliasNode.is(node)) {
		let inner = node.node;
		let changed = false;

		if (SelectQueryNode.is(inner)) {
			const rewrittenInner = rewriteSelectNode(inner, references);
			if (rewrittenInner !== inner) {
				inner = rewrittenInner;
				changed = true;
			}
		}

		if (TableNode.is(inner)) {
			const identifier = extractIdentifier(inner.table);
			if (identifier === "state") {
				const binding = IdentifierNode.is(node.alias)
					? node.alias.name
					: "state";
				references.push({ binding });
				return {
					operation: createStateAlias(binding),
					changed: true,
				};
			}
		}

		if (changed) {
			return {
				operation: AliasNode.create(inner as any, node.alias),
				changed: true,
			};
		}

		return {
			operation: node,
			changed: false,
		};
	}

	if (TableNode.is(node)) {
		const identifier = extractIdentifier(node.table);
		if (identifier === "state") {
			references.push({ binding: "state" });
			return {
				operation: createStateAlias("state"),
				changed: true,
			};
		}
	}

	return {
		operation: node,
		changed: false,
	};
}

function extractIdentifier(node: SchemableIdentifierNode): string | null {
	if (
		node.kind === "SchemableIdentifierNode" &&
		node.schema === undefined &&
		IdentifierNode.is(node.identifier)
	) {
		return node.identifier.name;
	}
	return null;
}

function createStateAlias(binding: string): AliasNode {
	const subquery = buildStateSubquery();
	return AliasNode.create(subquery, IdentifierNode.create(binding));
}

function buildStateSubquery(): SelectQueryNode {
	const qb = internalQueryBuilder as any;
	const alias = "sa";

	const builder = qb
		.selectFrom(`state_all as ${alias}`)
		.select((eb: any) => [
			eb.ref(`${alias}.entity_id`).as("entity_id"),
			eb.ref(`${alias}.schema_key`).as("schema_key"),
			eb.ref(`${alias}.file_id`).as("file_id"),
			eb.ref(`${alias}.plugin_key`).as("plugin_key"),
			eb.ref(`${alias}.snapshot_content`).as("snapshot_content"),
			eb.ref(`${alias}.schema_version`).as("schema_version"),
			eb.ref(`${alias}.created_at`).as("created_at"),
			eb.ref(`${alias}.updated_at`).as("updated_at"),
			eb
				.ref(`${alias}.inherited_from_version_id`)
				.as("inherited_from_version_id"),
			eb.ref(`${alias}.change_id`).as("change_id"),
			eb.ref(`${alias}.untracked`).as("untracked"),
			eb.ref(`${alias}.commit_id`).as("commit_id"),
			eb.ref(`${alias}.writer_key`).as("writer_key"),
			eb.ref(`${alias}.metadata`).as("metadata"),
		])
		.where(
			`${alias}.version_id`,
			"in",
			qb.selectFrom("active_version").select("version_id")
		);

	return builder.toOperationNode() as SelectQueryNode;
}

function buildTraceEntry(references: StateReference[]): PreprocessorTraceEntry {
	return {
		step: "rewrite_state_view_select",
		payload: {
			reference_count: references.length,
			bindings: references.map((ref) => ref.binding),
		},
	};
}
