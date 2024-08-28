import {
	pendingChangesAtom,
	projectAtom,
	bundlesNestedAtom,
	authorNameAtom,
} from "../../state.ts";
import { atom, useAtom } from "jotai";
import Layout, { Grid } from "../../layout.tsx";
import { FormEvent, useEffect, useState } from "react";
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import DiffBundleView from "../../components/DiffBundleView.tsx";
import { BundleNested } from "@inlang/sdk2";
import { useNavigate } from "react-router-dom";

const bundleIdsWithPendingChangesAtom = atom(async (get) => {
	const bundlesNested = await get(bundlesNestedAtom);
	const pendingChanges = await get(pendingChangesAtom);
	const pendingChangesVariantIds = pendingChanges.map((c) => c.value!.id);
	const bundleNestedWithChanges = bundlesNested.filter((bundle) =>
		bundle.messages.some((message) =>
			message.variants.some((variant) =>
				pendingChangesVariantIds.includes(variant.id)
			)
		)
	);
	return bundleNestedWithChanges;
});

export default function App() {
	const [project] = useAtom(projectAtom);
	const [pendingChanges] = useAtom(pendingChangesAtom);
	const [bundlesWithChanges] = useAtom(bundleIdsWithPendingChangesAtom);
	const [commitDescription, setCommitDescription] = useState<string>("");
	const [showDialog, setShowDialog] = useState(false);
	const navigate = useNavigate();

	const handleCommit = async () => {
		await project?.lix.commit({
			description: commitDescription,
		});
	};

	useEffect(() => {
		// close dialog after commit
		if (pendingChanges.length === 0) {
			setShowDialog(false);
			navigate("/");
		}
	});

	const getScopedChangesByBundle = (bundle: BundleNested) => {
		const pendingChangesForBundle = pendingChanges.filter((change) => {
			const variantId = change.value?.id;
			if (!variantId) return false;
			return bundle.messages.some((message) =>
				message.variants.some((variant) => variant.id === variantId)
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
								disabled={pendingChanges.length === 0}
								onClick={() => {
									setShowDialog(true);
								}}
							>
								Commit changes
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
											label="Description"
											helpText="Add a description of the changes"
											placeholder="I updated the german translations"
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											onInput={(e: any) => setCommitDescription(e.target.value)}
										></SlInput>
									</div>
									<div className="mt-6 flex justify-end">
										<SlButton variant="primary" slot="footer" type="submit">
											Commit changes
										</SlButton>
									</div>
								</form>
							</SlDialog>
						</div>
					</Grid>
				</div>
				<Grid>
					{bundlesWithChanges.length > 0 && (
						<div className="relative mb-8 mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
							{bundlesWithChanges.map((bundle) => (
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
