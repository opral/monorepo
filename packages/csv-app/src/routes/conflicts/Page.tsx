import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import { useAtom } from "jotai";
import { conflictsAtom } from "../../state-active-file.ts";

export default function Page() {
	const [conflicts] = useAtom(conflictsAtom);
	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{conflicts.map((conflict) => (
							<div>
								<p>change_id: {conflict.change_id}</p>
								<p>conflicting id: {conflict.conflicting_change_id}</p>
							</div>
						))}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
