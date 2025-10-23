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
import { sql } from "kysely";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../../types.js";
import { internalQueryBuilder } from "../../../internal-query-builder.js";

/**
 * Rewrites references to the `state_all` view so callers query the underlying
 * vtable directly instead of going through the SQLite view layer.
 */
export const rewriteStateAllViewSelect: PreprocessorStep = ({
	node,
	trace,
}) => {
	if (!SelectQueryNode.is(node)) {
		return node;
	}

	const references: StateAllReference[] = [];
	const rewritten = rewriteSelectNode(node, references);

	if (references.length === 0) {
		return rewritten;
	}

	trace?.push(buildTraceEntry(references));
	return rewritten;
};

interface StateAllReference {
	readonly binding: string;
}

type RewriteOutcome = {
	operation: OperationNode;
	changed: boolean;
};

function rewriteSelectNode(
	select: SelectQueryNode,
	references: StateAllReference[]
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
	references: StateAllReference[]
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
			if (identifier === "state_all") {
				const binding = IdentifierNode.is(node.alias)
					? node.alias.name
					: "state_all";
				references.push({ binding });
				return {
					operation: createStateAllAlias(binding),
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
		if (identifier === "state_all") {
			references.push({ binding: "state_all" });
			return {
				operation: createStateAllAlias("state_all"),
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

function createStateAllAlias(binding: string): AliasNode {
	const subquery = buildStateAllSubquery();
	return AliasNode.create(subquery, IdentifierNode.create(binding));
}

function buildStateAllSubquery(): SelectQueryNode {
	const qb = internalQueryBuilder as any;
	const alias = "v";

	const builder = qb
		.selectFrom(`lix_internal_state_vtable as ${alias}`)
		.select((eb: any) => [
			eb.ref(`${alias}.entity_id`).as("entity_id"),
			eb.ref(`${alias}.schema_key`).as("schema_key"),
			eb.ref(`${alias}.file_id`).as("file_id"),
			eb.ref(`${alias}.plugin_key`).as("plugin_key"),
			eb.ref(`${alias}.snapshot_content`).as("snapshot_content"),
			eb.ref(`${alias}.schema_version`).as("schema_version"),
			eb.ref(`${alias}.version_id`).as("version_id"),
			eb.ref(`${alias}.created_at`).as("created_at"),
			eb.ref(`${alias}.updated_at`).as("updated_at"),
			eb
				.ref(`${alias}.inherited_from_version_id`)
				.as("inherited_from_version_id"),
			eb.ref(`${alias}.change_id`).as("change_id"),
			eb.ref(`${alias}.untracked`).as("untracked"),
			eb.ref(`${alias}.commit_id`).as("commit_id"),
			eb.ref(`${alias}.writer_key`).as("writer_key"),
			sql`(SELECT json(metadata) FROM change WHERE change.id = ${eb.ref(
				`${alias}.change_id`
			)})`.as("metadata"),
		])
		.where(`${alias}.snapshot_content`, "is not", null);

	return builder.toOperationNode() as SelectQueryNode;
}

function buildTraceEntry(
	references: StateAllReference[]
): PreprocessorTraceEntry {
	return {
		step: "rewrite_state_all_view_select",
		payload: {
			reference_count: references.length,
			bindings: references.map((ref) => ref.binding),
		},
	};
}
