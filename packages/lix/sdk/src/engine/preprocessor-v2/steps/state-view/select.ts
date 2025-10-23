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
 * Rewrites references to the public `state` view so callers read from the
 * rewritten `state_all` representation while preserving the active-version
 * filter that the legacy view enforced.
 */
export const rewriteStateViewSelect: PreprocessorStep = ({
	node,
	trace,
}) => {
	if (!SelectQueryNode.is(node)) {
		return node;
	}

	const references = collectStateReferences(node);
	if (references.length === 0) {
		return node;
	}

	const rewritten = rewriteSelect(node, references);
	trace?.push(buildTraceEntry(references));
	return rewritten;
};

interface StateReference {
	readonly binding: string;
}

function collectStateReferences(select: SelectQueryNode): StateReference[] {
	const refs: StateReference[] = [];

	if (select.from?.froms) {
		for (const candidate of select.from.froms) {
			const ref = resolveReference(candidate);
			if (ref) refs.push(ref);
		}
	}

	if (select.joins) {
		for (const join of select.joins) {
			const ref = resolveReference(join.table);
			if (ref) refs.push(ref);
		}
	}

	return refs;
}

function resolveReference(node: OperationNode): StateReference | null {
	if (AliasNode.is(node)) {
		if (!TableNode.is(node.node)) return null;
		const identifier = extractIdentifier(node.node.table);
		if (!identifier || identifier !== "state") {
			return null;
		}
		const binding = IdentifierNode.is(node.alias)
			? node.alias.name
			: "state";
		return { binding };
	}

	if (TableNode.is(node)) {
		const identifier = extractIdentifier(node.table);
		if (!identifier || identifier !== "state") {
			return null;
		}
		return { binding: "state" };
	}

	return null;
}

function extractIdentifier(
	node: SchemableIdentifierNode
): string | null {
	if (
		node.kind === "SchemableIdentifierNode" &&
		node.schema === undefined &&
		IdentifierNode.is(node.identifier)
	) {
		return node.identifier.name;
	}
	return null;
}

function rewriteSelect(
	select: SelectQueryNode,
	references: StateReference[]
): SelectQueryNode {
	let mutated = false;
	let from = select.from;

	if (from?.froms) {
		const rewrittenFroms = from.froms.map((candidate) => {
			const rewritten = rewriteRelation(candidate, references);
			if (rewritten !== candidate) mutated = true;
			return rewritten;
		});
		if (mutated) {
			from = FromNode.create(rewrittenFroms);
		}
	}

	let joins = select.joins;
	if (joins && joins.length > 0) {
		const rewrittenJoins = joins.map((join) => {
			const rewrittenTable = rewriteRelation(join.table, references);
			if (rewrittenTable !== join.table) {
				mutated = true;
				return Object.freeze({
					...join,
					table: rewrittenTable,
				});
			}
			return join;
		});
		if (mutated) {
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
): OperationNode {
	if (AliasNode.is(node) && TableNode.is(node.node)) {
		const identifier = extractIdentifier(node.node.table);
		if (identifier !== "state") {
			return node;
		}
		const binding = IdentifierNode.is(node.alias)
			? node.alias.name
			: "state";
		return createStateAlias(binding);
	}

	if (TableNode.is(node)) {
		const identifier = extractIdentifier(node.table);
		if (identifier !== "state") {
			return node;
		}
		return createStateAlias("state");
	}

	return node;
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
			eb.ref(`${alias}.inherited_from_version_id`).as(
				"inherited_from_version_id"
			),
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

function buildTraceEntry(
	references: StateReference[]
): PreprocessorTraceEntry {
	return {
		step: "rewrite_state_view_select",
		payload: {
			reference_count: references.length,
			bindings: references.map((ref) => ref.binding),
		},
	};
}
