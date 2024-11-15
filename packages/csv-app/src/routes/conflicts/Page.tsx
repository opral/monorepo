import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import { useAtom } from "jotai";
import { changeConflictsAtom } from "../../state-active-file.ts";
import ConflictSet from "../../components/ConflictSet.tsx";
import clsx from "clsx";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { currentVersionAtom, lixAtom } from "../../state.ts";
import {
	changeIsLeafInVersion,
	createChangeConflict,
	detectChangeConflicts,
} from "@lix-js/sdk";
import { saveLixToOpfs } from "../../helper/saveLixToOpfs.ts";

export default function Page() {
	const [conflicts] = useAtom(changeConflictsAtom);
	const [lix] = useAtom(lixAtom);
	const [currentVersion] = useAtom(currentVersionAtom);

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{Object.entries(conflicts).map(([id, changes]) => {
							const uniqueColumnValue = changes[0].entity_id.split("|")[1];
							const isOutdated =
								changes.some(
									(change) => change.is_current_branch_pointer === 1
								) === false;
							return (
								<div
									key={id}
									className={
										"p-3 space-y-2 " +
										clsx(isOutdated && "opacity-50", "hover:opacity-100")
									}
								>
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<p className="font-bold">
												{isOutdated && "[Outdated] "}
												{changes[0].change_conflict_key}
											</p>
											<p className="text-gray-400">({id})</p>
										</div>
										<div className="flex gap-2">
											{isOutdated && (
												<>
													<SlButton
														size="small"
														onClick={async () => {
															await lix.db
																.transaction()
																.execute(async (trx) => {
																	const changesIncurrentBranch = changes.filter(
																		(change) => change.is_in_current_branch
																	);

																	const changesInOtherBranches = changes.filter(
																		(change) =>
																			change.is_in_current_branch === 0
																	);

																	const leafChanges = await Promise.all(
																		changesIncurrentBranch.map(async (c) => {
																			return await trx
																				.selectFrom("change")
																				.where(
																					changeIsLeafInVersion(currentVersion)
																				)
																				.where(
																					"change.entity_id",
																					"=",
																					c.entity_id
																				)
																				.selectAll()
																				.where("change.file_id", "=", c.file_id)
																				.where(
																					"change.schema_key",
																					"=",
																					c.schema_key
																				)
																				.executeTakeFirstOrThrow();
																		})
																	);

																	// re-trigger detecting conflicts
																	const detectedConflicts =
																		await detectChangeConflicts({
																			lix: { ...lix, db: trx },
																			changes: [
																				...leafChanges,
																				...changesInOtherBranches,
																			],
																		});
																	for (const detectedConflict of detectedConflicts) {
																		await createChangeConflict({
																			lix: { ...lix, db: trx },
																			version: currentVersion,
																			key: detectedConflict.key,
																			conflictingChangeIds:
																				detectedConflict.conflictingChangeIds,
																		});
																	}
																	await trx
																		.deleteFrom("change_conflict")
																		.where("id", "=", id)
																		.execute();
																});
															await saveLixToOpfs({ lix });
														}}
													>
														Update
													</SlButton>
													<SlButton
														size="small"
														onClick={() => {
															lix.db
																.deleteFrom("change_conflict")
																.where("id", "=", id)
																.execute();
														}}
													>
														Delete
													</SlButton>
												</>
											)}
										</div>
									</div>
									<ConflictSet
										lix={lix}
										changes={changes}
										uniqueColumnValue={uniqueColumnValue}
									></ConflictSet>
								</div>
							);
						})}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
