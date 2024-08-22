import { useAtom } from "jotai";
import Layout, { Grid } from "../../layout.tsx";
import { bundlesNestedAtom, conflictsAtom, projectAtom } from "../../state.ts";
import { useEffect, useState } from "react";
import DiffBundleView from "../../components/DiffBundleView.tsx";

export default function Page() {
	const [project] = useAtom(projectAtom);
	const [conflicts] = useAtom(conflictsAtom);
	const [bundlesNested] = useAtom(bundlesNestedAtom);
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
				.where("id", "=", conflict.conflicting_change_id)
				.executeTakeFirstOrThrow();
			// get the bundleId of the change
			const bundleWithConflict = bundlesNested.filter((bundle) =>
				bundle.messages.find((message) =>
					message.variants.find((variant) => variant.id === change.value.id)
				)
			);
			result[conflicting.id] = conflicting;
			result[change.id] = change;
			result[change.id].bundleId = bundleWithConflict[0].id;
		}
		setConflictingChanges(result);
	};

	useEffect(() => {
		const interval = setInterval(getConflictingChanges, 1000);
		return () => clearInterval(interval);
	});

	return (
		<Layout>
			<Grid>
				<div className="mt-8">
					{conflicts.length === 0 ? (
						<p>No Conflicts</p>
					) : (
						conflicts.map((c) => {
							const bundleId = conflictingChanges[c.change_id]?.bundleId;
							const change = conflictingChanges[c.change_id];
							const conflicting = conflictingChanges[c.conflicting_change_id];
							return (
								<div className="space-y-2">
									<h2 className="font-bold text-xl">
										This {change?.type} change{" "}
									</h2>
									<pre>{JSON.stringify(change?.value, undefined, 2)}</pre>
									<h2 className="font-bold text-xl">
										Conflicts with this {conflicting?.type} change
									</h2>
									<pre>{JSON.stringify(conflicting?.value, undefined, 2)}</pre>
									<h2 className="font-bold text-xl">Because</h2>
									<p>{c.reason}</p>
									{change && conflicting && (
										<>
											<DiffBundleView
												bundleId={bundleId}
												changes={[change, conflicting]}
											/>
										</>
									)}
								</div>
							);
						})
					)}
				</div>
			</Grid>
		</Layout>
	);
}
