import { useAtom } from "jotai";
import { ChangeGraph } from "../../components/ChangeGraph.tsx";
import { allChangesAtom, allEdgesAtom, changesCurrentBranchAtom } from "../../state-active-file.ts";
import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";

export default function Page() {
	const [allChanges] = useAtom(allChangesAtom);
	const [changesCurrentBranch] = useAtom(changesCurrentBranchAtom);
	const [allEdges] = useAtom(allEdgesAtom);

	return (
		<OpenFileLayout>
			<div className="h-screen">
				<ChangeGraph changes={allChanges} edges={allEdges} highlightChanges={changesCurrentBranch}></ChangeGraph>
			</div>
		</OpenFileLayout>
	);
}
