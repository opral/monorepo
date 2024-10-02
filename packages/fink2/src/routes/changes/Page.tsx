import {
	groupedPendingChangesAtom,
	projectAtom,
	bundlesWithPendingChangesAtom,
} from "../../state.ts";
import { useAtom } from "jotai";
import Layout, { Grid } from "../../layout.tsx";
import { FormEvent, useEffect, useState } from "react";
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import DiffBundleView from "../../components/DiffBundleView.tsx";
import { BundleNested, humanId } from "@inlang/sdk2";
import { useNavigate } from "react-router-dom";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [groupedPendingChanges] = useAtom(groupedPendingChangesAtom);
	const [bundlesWithPendingChanges] = useAtom(bundlesWithPendingChangesAtom);
	const [commitDescription, setCommitDescription] = useState<string>("");
	const [showDialog, setShowDialog] = useState(false);
	const navigate = useNavigate();

	const handleCommit = async () => {
		for (const change of groupedPendingChanges) {
			await project?.lix.db
				.updateTable("change")
				.where("id", "=", change.id)
				.set("meta", { ...change.meta, tag: "confirmed", change_set: humanId() })
				.executeTakeFirst();
		}
		await project?.lix.commit({
			description: commitDescription,
		});
	};

	useEffect(() => {
		// close dialog after commit
		if (groupedPendingChanges.length === 0) {
			setShowDialog(false);
			navigate("/");
		}
	});

	const getScopedChangesByBundle = (bundle: BundleNested) => {
		const pendingChangesForBundle = groupedPendingChanges.filter((change) => {
			const changeId = change.value?.id;
			if (!changeId) return false;
			if (bundle.id === changeId) return true;
			return bundle.messages.some((message) => 
				message.id === changeId ||
				message.variants.some((variant) => variant.id === changeId)
			);
		});

		return pendingChangesForBundle;
	};

	return (
		<>
			<Layout>
				<div className="bg-white border-b border-zinc-200">
					<Grid>
						<div className="py-6 flex justify-between items-center">
							<h2 className="text-[20px]">Changes</h2>
							<SlButton
								size="small"
								variant="default"
								disabled={groupedPendingChanges.length === 0}
								onClick={() => {
									setShowDialog(true);
								}}
							>
								Confirm changes
							</SlButton>
							<SlDialog
								label="Add commit details"
								open={showDialog}
								onSlRequestClose={() => setShowDialog(false)}
							>
								<form
									onSubmit={(e: FormEvent<Element>) => {
										e.preventDefault();
										handleCommit();
									}}
								>
									<div className="flex flex-col gap-4">
										<SlInput
											required
											autoFocus
											label="Description"
											helpText="Add a description of the changes"
											placeholder="I updated the german translations"
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											onInput={(e: any) => setCommitDescription(e.target.value)}
										></SlInput>
									</div>
									<div className="mt-6 flex justify-end">
										<SlButton variant="primary" slot="footer" type="submit">
											Confirm changes
										</SlButton>
									</div>
								</form>
							</SlDialog>
						</div>
					</Grid>
				</div>
				<Grid>
					{bundlesWithPendingChanges.length > 0 && (
						<div className="relative mb-8 mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
							{bundlesWithPendingChanges.map((bundle) => (
								<DiffBundleView
									changes={getScopedChangesByBundle(bundle)}
									bundleId={bundle.id}
									key={bundle.id}
								/>
							))}
						</div>
					)}
				</Grid>
			</Layout>
		</>
	);
}
