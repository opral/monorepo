import { commitsAtom } from "../../state.ts";
import { useAtom } from "jotai";
import Layout, { Grid } from "../../layout.tsx";
import HistoryEntry from "../../components/HistoryEntry.tsx";

export default function App() {
	const [commits] = useAtom(commitsAtom);

	return (
		<>
			<Layout>
				<div className="bg-white border-b border-zinc-200">
					<Grid>
						<div className="py-6 flex justify-between items-center">
							<h2 className="text-[20px]">History</h2>
						</div>
					</Grid>
				</div>
				<Grid>
					<div className="relative bg-white divide-y divide-zinc-200 border border-zinc-200 my-8 rounded-lg">
						{commits.map((commit) => (
							<HistoryEntry commit={commit} key={commit.id} />
						))}
					</div>
				</Grid>
			</Layout>
		</>
	);
}
