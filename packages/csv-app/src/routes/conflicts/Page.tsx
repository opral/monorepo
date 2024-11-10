import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import { useAtom } from "jotai";
import { changeConflictsAtom } from "../../state-active-file.ts";
import ConflictSet from "../../components/ConflictSet.tsx";

export default function Page() {
	const [conflicts] = useAtom(changeConflictsAtom);

	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{Object.entries(conflicts).map(([id, changes]) => {
							const uniqueColumnValue = changes[0].entity_id.split("|")[1];
							return (
								<div key={id} className="p-3 space-y-2">
									<div className="flex items-center gap-2">
										<p className="font-bold">
											{changes[0].change_conflict_key}
										</p>
										<p className="text-gray-400">({id})</p>
									</div>
									<ConflictSet
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
