import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import ChangeSet from "../../components/ChangeSet.tsx";
import { useAtom } from "jotai";
import {
	checkpointChangeSetsAtom,
	intermediateChangesAtom,
	workingChangeSetAtom,
} from "../../state-active-file.ts";

export default function Page() {
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const [workingChangeSet] = useAtom(workingChangeSetAtom);

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{/* virtual change set for uncommitted changes */}
						{intermediateChanges.length > 0 && (
							<ChangeSet
								key={workingChangeSet?.id}
								changeSetid={workingChangeSet!.id}
								authorName={null}
							/>
						)}
						{checkpointChangeSets.map((checkpointChangeSet, index) => {
							const previousCheckpointId = checkpointChangeSets[index + 1]?.id ?? undefined;
							return (
								<ChangeSet
									key={checkpointChangeSet.id}
									changeSetid={checkpointChangeSet.id || ""}
									previousChangeSetId={previousCheckpointId}
									authorName={checkpointChangeSet.author_name}
								/>
							);
						})}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
