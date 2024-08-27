import { commitsAtom } from "../../state.ts";
import { useAtom } from "jotai";
import Layout, { Grid } from "../../layout.tsx";
import timeAgo from "../../helper/timeAgo.ts";

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
					{/* {commits.length > 0 && (
						<div className="w-full pl-[48px] flex items-center gap-8 text-sm! text-zinc-500 font-medium pt-4 pb-6">
							History
							<div className="w-full h-[2px] bg-zinc-200 flex-1" />
						</div>
					)} */}
					<div className="relative bg-white divide-y divide-zinc-200 border border-zinc-200 my-8 rounded-lg">
						{commits.map((commit) => (
							<div
								key={commit.id + Math.random()}
								className="flex gap-3 items-center"
							>
								<div className="w-5 h-5 bg-zinc-100 flex items-center justify-center rounded-full ml-4">
									<div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
								</div>
								<div className="flex-1 flex gap-2 items-center justify-between pr-4 py-3 rounded h-[46px]">
									<div className="flex gap-2 items-center">
										<p className="text-zinc-950 text-sm! font-semibold">
											By {commit.author}
										</p>
										<p className="text-sm! text-zinc-600">
											{commit.description}
										</p>
									</div>
									<p className="text-sm!">{timeAgo(commit.created!)}</p>
								</div>
							</div>
						))}
					</div>
				</Grid>
			</Layout>
		</>
	);
}
