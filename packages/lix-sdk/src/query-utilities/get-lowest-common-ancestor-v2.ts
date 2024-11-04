import type { Change } from "../database/schema.js";
import type { LixReadonly } from "../plugin/lix-plugin.js";

/**
 * Returns the lowest common ancestor of two changes.
 *
 * @returns Either the lowest common ancestor of the two changes or `undefined` if they do not share a common ancestor.
 */
export async function getLowestCommonAncestorV2(args: {
	lix: Pick<LixReadonly, "db">;
	changeA: Pick<Change, "id">;
	changeB: Pick<Change, "id">;
}): Promise<Change | undefined> {
	// check for direct ancestors first before running the recursive query
	const directAncestorA = await args.lix.db
		.selectFrom("change_graph_edge")
		.where("parent_id", "=", args.changeA.id)
		.where("child_id", "=", args.changeB.id)
		.select("parent_id")
		.executeTakeFirst();

	if (directAncestorA) {
		return args.lix.db
			.selectFrom("change")
			.selectAll()
			.where("id", "=", args.changeA.id)
			.executeTakeFirstOrThrow();
	}

	const directAncestorB = await args.lix.db
		.selectFrom("change_graph_edge")
		.where("parent_id", "=", args.changeB.id)
		.where("child_id", "=", args.changeA.id)
		.select("parent_id")
		.executeTakeFirst();

	if (directAncestorB) {
		return args.lix.db
			.selectFrom("change")
			.selectAll()
			.where("id", "=", args.changeB.id)
			.executeTakeFirstOrThrow();
	}

	// run the recursive query

	const result = await args.lix.db
		.withRecursive("changeA_ancestors", (eb) =>
			eb
				.selectFrom("change_graph_edge")
				.select(["parent_id", "child_id"])
				.where("child_id", "=", args.changeA.id)
				.unionAll(
					eb
						.selectFrom("change_graph_edge")
						.select([
							"change_graph_edge.parent_id",
							"change_graph_edge.child_id",
						])
						.innerJoin(
							"changeA_ancestors",
							"changeA_ancestors.parent_id",
							"change_graph_edge.child_id",
						),
				),
		)
		.withRecursive("changeB_ancestors", (eb) =>
			eb
				.selectFrom("change_graph_edge")
				.select(["parent_id", "child_id"])
				.where("child_id", "=", args.changeB.id)
				.unionAll(
					eb
						.selectFrom("change_graph_edge")
						.select([
							"change_graph_edge.parent_id",
							"change_graph_edge.child_id",
						])
						.innerJoin(
							"changeB_ancestors",
							"changeB_ancestors.parent_id",
							"change_graph_edge.child_id",
						),
				),
		)
		// Compare ancestors at each recursive step
		.selectFrom("changeA_ancestors")
		.innerJoin(
			"changeB_ancestors",
			"changeA_ancestors.parent_id",
			"changeB_ancestors.parent_id",
		)
		// Return only if both changes directly diverge from a common ancestor
		.where("changeA_ancestors.child_id", "=", args.changeA.id)
		.where("changeB_ancestors.child_id", "=", args.changeB.id)
		.select("changeA_ancestors.parent_id as common_ancestor_id")
		.executeTakeFirst();

	if (result === undefined) {
		return undefined;
	}

	const commonAncestor = await args.lix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", result.common_ancestor_id)
		.executeTakeFirstOrThrow();

	return commonAncestor;
}
