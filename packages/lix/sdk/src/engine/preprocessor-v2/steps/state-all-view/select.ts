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
 * Rewrites references to the `state_all` view so they bypass the SQLite view
 * layer and target the underlying internal vtable directly.
 *
 * The transformation emits a sub-query that mirrors the legacy view definition,
 * preserving all exposed columns and filters (e.g. dropping tombstones), while
 * ensuring downstream steps (like the vtable rewrite) can operate on the native
 * table representation.
 */
export const rewriteStateAllViewSelect: PreprocessorStep = ({
	node,
	trace,
}) => {
	if (!SelectQueryNode.is(node)) {
		return node;
	}

	const references = collectStateAllReferences(node);
	if (references.length === 0) {
		return node;
	}

	const rewritten = rewriteSelect(node, references);
	if (trace) {
		trace.push(buildTraceEntry(references));
	}

	return rewritten;
};

interface StateAllReference {
	readonly binding: string;
}

function collectStateAllReferences(select: SelectQueryNode): StateAllReference[] {
	const refs: StateAllReference[] = [];

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

function resolveReference(node: OperationNode): StateAllReference | null {
	if (AliasNode.is(node)) {
		if (!TableNode.is(node.node)) return null;
		const identifier = extractIdentifier(node.node.table);
		if (!identifier || identifier !== "state_all") {
			return null;
		}
		const binding = IdentifierNode.is(node.alias)
			? node.alias.name
			: "state_all";
		return { binding };
	}

	if (TableNode.is(node)) {
		const identifier = extractIdentifier(node.table);
		if (!identifier || identifier !== "state_all") {
			return null;
		}
		return { binding: "state_all" };
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
	references: StateAllReference[]
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
	references: StateAllReference[]
): OperationNode {
	if (AliasNode.is(node) && TableNode.is(node.node)) {
		const identifier = extractIdentifier(node.node.table);
		if (identifier !== "state_all") {
			return node;
		}
		const binding = IdentifierNode.is(node.alias)
			? node.alias.name
			: "state_all";
		return createStateAllAlias(binding);
	}

	if (TableNode.is(node)) {
		const identifier = extractIdentifier(node.table);
		if (identifier !== "state_all") {
			return node;
		}
		return createStateAllAlias("state_all");
	}

	return node;
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
			eb.ref(`${alias}.inherited_from_version_id`).as(
				"inherited_from_version_id"
			),
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
