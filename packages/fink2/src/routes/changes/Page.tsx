import {
	commitsAtom,
	pendingChangesAtom,
	projectAtom,
	bundlesNestedAtom,
} from "../../state.ts";
import { atom, useAtom } from "jotai";
import Layout from "../../layout.tsx";
import { FormEvent, useEffect, useState } from "react";
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import DiffBundleView from "../../components/DiffBundleView.tsx";
import { BundleNested } from "@inlang/sdk2";
import timeAgo from "../../helper/timeAgo.ts";

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
	const [commits] = useAtom(commitsAtom);
	const [bundlesWithChanges] = useAtom(bundleIdsWithPendingChangesAtom);
	const [commitAuthor, setCommitAuthor] = useState<string>("");
	const [commitDescription, setCommitDescription] = useState<string>("");
	const [showDialog, setShowDialog] = useState(false);

	const handleCommit = async () => {
		await project?.lix.commit({
			userId: commitAuthor,
			description: commitDescription,
		});
	};

	useEffect(() => {
		// close dialog after commit
		if (pendingChanges.length === 0) {
			setShowDialog(false);
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
				<div className="relative pb-10">
					{commits.length > 0 && (
						<div className="w-[1px] h-full absolute pt-6 translate-x-[9.3px] -z-10">
							<div className="w-full h-[calc(100%_+_70px)] border-r-[2px] border-zinc-400 border-dashed" />
						</div>
					)}

					<div className="w-full flex gap-3 items-center">
						{pendingChanges.length > 0 ? (
							<div className="w-5 h-5 bg-blue-100 flex items-center justify-center rounded-full">
								<div className="w-2 h-2 bg-blue-600 rounded-full" />
							</div>
						) : (
							<div className="w-5 h-5 bg-zinc-100 flex items-center justify-center rounded-full">
								<div className="w-2 h-2 bg-zinc-600 rounded-full" />
							</div>
						)}

						<div className="flex-1 flex gap-4 items-center bg-zinc-100 rounded px-4 py-2 justify-between">
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium">
									<span className="text-zinc-800 bg-zinc-300 px-[6px] py-[2px] rounded mr-2">
										{pendingChanges.length}
									</span>
									{pendingChanges.length === 1
										? "Pending change"
										: "Pending changes"}
								</p>
								{/* <p>{numCommittedChanges} Committed changes </p>
						<p>{numCommits} Commits</p> */}
							</div>
							<SlButton
								size="small"
								variant="primary"
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
											label="Author"
											helpText="Enter your name"
											placeholder="Max Mustermann"
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											onInput={(e: any) => setCommitAuthor(e.target.value)}
										></SlInput>
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
					</div>

					<div className="pl-[30px]">
						{bundlesWithChanges.map((bundle) => (
							<DiffBundleView
								changes={getScopedChangesByBundle(bundle)}
								bundleId={bundle.id}
								key={bundle.id}
							/>
						))}
					</div>
				</div>

				{/* <div className="flex gap-4 items-center bg-zinc-100 rounded px-4 py-2 justify-between mt-8 h-[46px]">
					<div className="flex items-center gap-2 justify-between w-full">
						<p className="text-sm font-medium">Commit history</p>
						<div className="text-xs! text-zinc-700 bg-zinc-300 h-5 rounded flex items-center px-2 font-medium">
							{commits.length} commits
						</div>
					</div>
				</div> */}
				{commits.length > 0 && (
					<div className="w-full pl-[48px] flex items-center gap-8 text-sm! text-zinc-500 font-medium pt-4 pb-6">
						History
						<div className="w-full h-[2px] bg-zinc-200 flex-1" />
					</div>
				)}
				<div className="flex flex-col gap-2 relative">
					<div className="w-[1px] h-full absolute py-6 translate-x-[9.3px] -z-10">
						<div className="w-full h-full border-r-[2px] border-zinc-400" />
					</div>
					{commits.map((commit) => (
						<div
							key={commit.id + Math.random()}
							className="flex gap-3 items-center"
						>
							<div className="w-5 h-5 bg-white flex items-center justify-center rounded-full">
								<div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
							</div>
							<div className="flex-1 flex gap-2 items-center justify-between bg-zinc-50 px-4 py-3 rounded h-[46px]">
								<div className="flex gap-2 items-center">
									<p className="text-zinc-950 text-sm! font-semibold">
										By {commit.user_id}
									</p>
									<p className="text-sm! text-zinc-600">{commit.description}</p>
								</div>
								<p className="text-sm!">{timeAgo(commit.created!)}</p>
							</div>
						</div>
					))}
				</div>
			</Layout>
		</>
	);
}