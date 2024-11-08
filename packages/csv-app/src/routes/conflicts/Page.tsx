import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import { useAtom } from "jotai";
import { changeConflictsAtom } from "../../state-active-file.ts";

export default function Page() {
	const [conflicts] = useAtom(changeConflictsAtom);

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{Object.entries(conflicts).map(([id, edges]) => (
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
