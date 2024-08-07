import { projectAtom } from "../../state.ts";
import { useAtom } from "jotai";
import Layout from "../../layout.tsx";
import { useEffect, useState } from "react";
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import DiffBundleView from "../../components/DiffBundleView.tsx";
import { BundleNested, selectBundleNested } from "@inlang/sdk2";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [uncommittedChanges, setUncommittedChanges] = useState<Array<any>>([]);
	const [numCommits, setNumCommits] = useState<number>(0);
	const [bundlesWithChanges, setBundlesWithChanges] = useState<Array<any>>([]);
	const [commitAuthor, setCommitAuthor] = useState<string>("");
	const [commitDescription, setCommitDescription] = useState<string>("");
	const [showDialog, setShowDialog] = useState(false);
	const [commitedChanges, setCommitedChanges] = useState<Array<any>>([]);

	const setNumbers = async () => {
		if (!project) return;
		const newUncommittedChanges = await project.lix.db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "is", null)
			.execute();

		if (newUncommittedChanges) {
			setUncommittedChanges(newUncommittedChanges);

			const atomsWithChanges = newUncommittedChanges
				.map((change) => change.value?.id)
				.filter((id) => id !== undefined) as string[];

			const bundlesWithChanges = await selectBundleNested(project.db)
				.where(({ eb, selectFrom }) =>
					eb.exists(
						selectFrom("message")
							.selectAll()
							.whereRef("message.bundleId", "=", "bundle.id")
							.where(({ eb, selectFrom }) =>
								eb.exists(
									selectFrom("variant")
										.selectAll()
										.whereRef("variant.messageId", "=", "message.id")
										.where("variant.id", "in", atomsWithChanges)
								)
							)
					)
				)
				.execute();

			if (bundlesWithChanges) {
				setBundlesWithChanges(bundlesWithChanges);
			}
		}

		const numCommits = await project.lix.db
			.selectFrom("commit")
			.selectAll()
			.execute();

		if (numCommits) {
			setNumCommits(numCommits.length);
		}

		const commitedChanges = await project.lix.db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "is not", null)
			.innerJoin("commit", "commit.id", "change.commit_id")
			.orderBy("commit.zoned_date_time desc")
			.execute();

		if (commitedChanges) {
			setCommitedChanges(commitedChanges);
		}
	};

	const handleCommit = async () => {
		//console.log("executing commit");
		await project?.lix.commit({
			userId: commitAuthor,
			description: commitDescription,
		});
		setShowDialog(false);
	};

	const getScopedChangesByBundle = (bundle: BundleNested) => {
		const uncommittedChangesForBundle = uncommittedChanges.filter((change) => {
			const variantId = change.value?.id;
			if (!variantId) return false;
			return bundle.messages.some((message) =>
				message.variants.some((variant) => variant.id === variantId)
			);
		});
		return uncommittedChangesForBundle;
	};

	useEffect(() => {
		setNumbers();
		setInterval(async () => {
			setNumbers();
		}, 1500);
	}, []);

	return (
		<>
			<Layout>
				<div className="flex gap-4 items-center bg-zinc-100 rounded px-4 py-2 justify-between">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">
							{uncommittedChanges.length} Pending change[s]
						</p>
						{/* <p>{numCommittedChanges} Committed changes </p>
						<p>{numCommits} Commits</p> */}
					</div>
					<SlButton
						size="small"
						variant="primary"
						onClick={() => {
							setShowDialog(true);
						}}
					>
						commit changes
					</SlButton>
					<SlDialog
						label="Add commit details"
						open={showDialog}
						onSlRequestClose={() => setShowDialog(false)}
					>
						<div className="flex flex-col gap-4">
							<SlInput
								label="Author"
								helpText="Enter your name"
								placeholder="Max Mustermann"
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								onInput={(e: any) => setCommitAuthor(e.target.value)}
							></SlInput>
							<SlInput
								label="Description"
								helpText="Add a description of the changes"
								placeholder="I updated the german translations"
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								onInput={(e: any) => setCommitDescription(e.target.value)}
							></SlInput>
						</div>
						<SlButton variant="primary" slot="footer" onClick={handleCommit}>
							Commit changes
						</SlButton>
					</SlDialog>
				</div>
				{bundlesWithChanges.map((bundle) => (
					<DiffBundleView
						changes={getScopedChangesByBundle(bundle)}
						bundleId={bundle.id}
						key={bundle.id}
					/>
				))}
				<div className="flex gap-4 items-center bg-zinc-100 rounded px-4 py-2 justify-between mt-8 h-[46px]">
					<div className="flex items-center gap-2 justify-between w-full">
						<p className="text-sm font-medium">History</p>
						<div className="text-xs! text-zinc-700 bg-zinc-300 h-5 rounded flex items-center px-2 font-medium">
							{numCommits} commits
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-2 py-4">
					{commitedChanges.map((change) => (
						<p
							key={change.id}
							className="text-zinc-600 h-[46px] bg-zinc-50 px-4 py-3 rounded"
						>
							<span className="font-bold text-zinc-950">You</span>
							{" changed the "}
							<span className="font-bold text-zinc-950">
								{change.type}
							</span>{" "}
							with the id{" "}
							<span className="font-bold text-zinc-950">
								{change.value?.id}
							</span>
						</p>
					))}
				</div>
			</Layout>
		</>
	);
}
