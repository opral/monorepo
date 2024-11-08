import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import { useAtom } from "jotai";
import { changeConflictsEdgesAtom } from "../../state-active-file.ts";
import { ChangeConflictEdge } from "@lix-js/sdk";

export default function Page() {
	const [conflictEdges] = useAtom(changeConflictsEdgesAtom);

	const groupedByConflictId: { [key: string]: ChangeConflictEdge[] } = {};

	for (const edge of conflictEdges) {
		const conflictId = edge.change_conflict_id;
		if (!groupedByConflictId[conflictId]) {
			groupedByConflictId[conflictId] = [];
		}
		groupedByConflictId[conflictId].push(edge);
	}

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{Object.entries(groupedByConflictId).map(([id, edges]) => (
							<div key={id} className="p-3 space-y-2">
								<p className="font-bold">Conflict {id}</p>
								<p className="italic">Changes</p>
								{edges.map((edge) => (
									<p key={`${edge.change_conflict_id}-${edge.change_id}`}>
										<p>{edge.change_id}</p>
									</p>
								))}
							</div>
						))}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
