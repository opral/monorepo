import type { Change } from "../database/schema.js";
import type { DetectedConflict, LixReadonly } from "../plugin/lix-plugin.js";
import { detectDivergingEntityConflict } from "./detect-diverging-entity-conflict.js";

/**
 * Detects conflicts in the given set of changes.
 *
 * The caller is responsible for filtering out changes
 * that should not lead to conflicts before calling this function.
 *
 * For example, detecting conflicts between two versiones should
 * only include changes that are different between the two versiones
 * when calling this function.
 *
 * @example
 *   const detectedConflicts = await detectChangeConflicts({
 *        lix: lix,
 *        changes: diffingChages,
 *   });
 */
export async function detectChangeConflicts(args: {
	lix: Pick<LixReadonly, "db" | "plugin">;
	changes: Change[];
}): Promise<DetectedConflict[]> {
	const detectedConflicts: DetectedConflict[] = [];
	const plugins = await args.lix.plugin.getAll();

	// let plugin detect conflicts
	await Promise.all(
		plugins.map(async (plugin) => {
			if (plugin.detectConflicts) {
				const conflicts = await plugin.detectConflicts({
					lix: args.lix,
					changes: args.changes,
				});
				detectedConflicts.push(...conflicts);
			}
		}),
	);

	// auto detect diverging entity conflicts

	// group by the primary key (entity_id, file_id, type)
	const groupedByEntity = Object.groupBy(
		args.changes,
		(change) => `${change.entity_id}_${change.file_id}_${change.schema_key}`,
	);
	for (const changes of Object.values(groupedByEntity)) {
		if (changes === undefined) {
			continue;
		}

		if (changes.length > 1) {
			const divergingEntityConflict = await detectDivergingEntityConflict({
				lix: args.lix,
				changes,
			});
			if (divergingEntityConflict) {
				detectedConflicts.push(divergingEntityConflict);
			}
		}
	}

	return detectedConflicts;
}
