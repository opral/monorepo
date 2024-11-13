import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import { useAtom } from "jotai";
import { branchDiffAtom } from "../../state-active-file.ts";
import ConflictSet from "../../components/ConflictSet.tsx";
import ChangeSet from "../../components/ChangeSet.tsx";
import { lixAtom } from "../../state.ts";

export default function Page() {
	const [lix] = useAtom(lixAtom);
	const [diff] = useAtom(branchDiffAtom);

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{diff && (
							<>
								<h1 className="p-3 text-xl font-bold">Conflicts</h1>
								{diff.detectedConflicts.map((detectedConflict) => {
									const changes = diff.changes.filter((change) =>
										detectedConflict.conflictingChangeIds.has(change.id)
									);
									const uniqueColumnValue = changes[0].entity_id.split("|")[1];

									return (
										<div
											key={detectedConflict.conflictingChangeIds.toString()}
											className={"p-3 space-y-2 "}
										>
											<div className="flex justify-between items-center">
												<div className="flex items-center gap-2">
													<p className="font-medium">{detectedConflict.key}</p>
												</div>
											</div>
											<ConflictSet
												lix={lix}
												// @ts-expect-error - return type of the diff function differs from the expected type
												changes={changes}
												uniqueColumnValue={uniqueColumnValue}
											></ConflictSet>
										</div>
									);
								})}
								<h1 className="p-3 text-xl font-bold">Changes</h1>
								{diff.changes.map((change) => {
									return (
										<ChangeSet id={change.id} firstComment={null}></ChangeSet>
									);
								})}
							</>
						)}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
