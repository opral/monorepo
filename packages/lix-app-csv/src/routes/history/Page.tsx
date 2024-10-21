// import { useAtom } from "jotai";
import PageHeader from "../../components/PageHeader.tsx";
import Layout from "../editor/layout.tsx";
// import { commitsAtom } from "../../state.ts";
// import { HistoryEntry } from "../../components/HistoryEntry.tsx";

export default function HistoryPage() {
	// const [commits] = useAtom(commitsAtom);

	return (
		<>
			<Layout setShowImportDialog={() => {}}>
				<PageHeader title="Table History" />
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{/* {commits.map((commit) => {
							return <HistoryEntry commit={commit} key={commit.id} />;
						})} */}
					</div>
				</div>
			</Layout>
		</>
	);
}
