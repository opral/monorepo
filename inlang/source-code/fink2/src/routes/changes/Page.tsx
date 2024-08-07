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

export default function App() {
	const [project] = useAtom(projectAtom);
	const [uncommittedChanges, setUncommittedChanges] = useState<Array<any>>([]);
	const [commitAuthor, setCommitAuthor] = useState<string>("");
	const [commitDescription, setCommitDescription] = useState<string>("");
	const [showDialog, setShowDialog] = useState(false);

	const setNumbers = async () => {
		const newUncommittedChanges = await project?.lix.db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "is", null)
			.execute();

		if (
			newUncommittedChanges &&
			JSON.stringify(uncommittedChanges) !==
				JSON.stringify(newUncommittedChanges)
		) {
			setUncommittedChanges(newUncommittedChanges);
		}
	};

	const handleCommit = async () => {
		console.log("executing commit");
		await project?.lix.commit({
			userId: commitAuthor,
			description: commitDescription,
		});
		setShowDialog(false);
	};

	useEffect(() => {
		setNumbers();
		setInterval(async () => {
			setNumbers();
		}, 1500);
	});

	return (
		<>
			<Layout>
				<div className="flex gap-4 items-center bg-zinc-100 rounded px-4 py-2 justify-between">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">
							{uncommittedChanges.length} Outstanding change[s]
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
				{uncommittedChanges.map((change) => (
					<DiffBundleView change={change} key={change.id} />
				))}
			</Layout>
		</>
	);
}
