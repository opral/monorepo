import { useAtom } from "jotai";
import Layout from "../../layout.tsx";
import { conflictsAtom, projectAtom } from "../../state.ts";
import { useEffect, useState } from "react";

export default function Page() {
	const [project] = useAtom(projectAtom);
	const [conflicts] = useAtom(conflictsAtom);
	const [conflictingChanges, setConflictingChanges] = useState({});

	const getConflictingChanges = async () => {
		const result = {};
		for (const conflict of conflicts) {
			const change = await project?.lix.db
				.selectFrom("change")
				.selectAll()
				.where("id", "=", conflict.change_id)
				.executeTakeFirstOrThrow();
			const conflicting = await project?.lix.db
				.selectFrom("change")
				.selectAll()
				.where("id", "=", conflict.conflicts_with_change_id)
				.executeTakeFirstOrThrow();

			result[conflicting.id] = conflicting;
			result[change.id] = change;
		}
		setConflictingChanges(result);
	};

	useEffect(() => {
		const interval = setInterval(getConflictingChanges, 1000);
		return () => clearInterval(interval);
	});

	return (
		<Layout>
			{conflicts.length === 0 ? (
				<p>No Conflicts</p>
			) : (
				conflicts.map((c) => {
					const change = conflictingChanges[c.change_id];
					const conflicting = conflictingChanges[c.conflicts_with_change_id];
					return (
						<div className="space-y-2">
							<h2 className="font-bold text-xl">This {change?.type} change </h2>
							<p>{JSON.stringify(change?.value, undefined, 2)}</p>
							<h2 className="font-bold text-xl">
								Conflicts with this {conflicting?.type} change
							</h2>
							<p>{JSON.stringify(conflicting?.value, undefined, 2)}</p>
							<h2 className="font-bold text-xl">Because</h2>
							<p>{c.reason}</p>
						</div>
					);
				})
			)}
		</Layout>
	);
}
