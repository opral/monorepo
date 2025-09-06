// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { openLix, toBlob } from "@lix-js/sdk";
import { mockChanges } from "./mockChanges.js";
import { detectChanges } from "../detectChanges.js";

/**
 * Mocks a conflict between the source and target changes
 *
 * @param args.common - The common file data
 * @param args.source - The source file data
 * @param args.target - The target file data
 *
 * @returns The common, source, and target lix instances and the leaf changes only in the source
 *
 * @example
 *   ```
 *   const mock = await mockConflicts({ ... })
 *   const conflicts = await detectConflicts(mock)
 *   ```
 */
export async function mockConflicts(args: {
	common: Uint8Array;
	source: Uint8Array;
	target: Uint8Array;
	metadata: Record<string, string>;
}) {
	const { lix: commonLix } = await mockChanges({
		lix: await openLix({
			providePlugins: [{ key: "mock", detectChanges, detectChangesGlob: "*" }],
		}),
		file: { path: "/mock", metadata: args.metadata },
		fileUpdates: [args.common],
	});

	const commonLixBlob = await toBlob({ lix: commonLix });

	const { lix: sourceLix } = await mockChanges({
		lix: await openLix({
			blob: commonLixBlob,
			providePlugins: [{ key: "mock", detectChanges, detectChangesGlob: "*" }],
		}),
		file: { path: "mock", metadata: args.metadata },
		fileUpdates: [args.source],
	});

	const { lix: targetLix } = await mockChanges({
		lix: await openLix({
			blob: commonLixBlob,
			providePlugins: [{ key: "mock", detectChanges, detectChangesGlob: "*" }],
		}),
		fileUpdates: [args.target],
		file: { path: "/mock", metadata: args.metadata },
	});

	const getSnapshotsOfConflict = async (conflict: any) => {
		const snapshot = await sourceLix.db
			.selectFrom("change")
			.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
			.select("snapshot.content")
			.where("change.id", "=", conflict.conflicting_change_id)
			.executeTakeFirstOrThrow();

		const conflictingSnapshot = await targetLix.db
			.selectFrom("change")
			.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
			.select("snapshot.content")
			.where("change.id", "=", conflict.change_id)
			.executeTakeFirstOrThrow();

		return {
			snapshot: snapshot.content,
			conflicting_snapshot: conflictingSnapshot.content,
		};
	};

	return {
		commonLix,
		sourceLix,
		targetLix,
		getSnapshotsOfConflict,
	};
}
