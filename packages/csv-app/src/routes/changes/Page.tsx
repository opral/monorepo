import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import ChangeSet from "../../components/ChangeSet.tsx";
import { useAtom } from "jotai";
import {
	checkpointChangeSetsAtom,
	intermediateChangesAtom,
} from "../../state-active-file.ts";

export default function Page() {
	const [changeSets] = useAtom(checkpointChangeSetsAtom);
	const [intermediateChanges] = useAtom(intermediateChangesAtom);

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{/* virtual change set for uncommitted changes */}
						{intermediateChanges.length > 0 && (
							<ChangeSet
								key={"intermediate-changes"}
								id={"intermediate-changes"}
								authorName={null}
							/>
						)}
						{changeSets.map((changeSet) => (
							<ChangeSet
								key={changeSet.id}
								id={changeSet.id}
								authorName={changeSet.author_name}
							/>
						))}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
