import { SlIcon } from "@shoelace-style/shoelace/dist/react";
import timeAgo from "../helper/timeAgo.ts";
import { Change } from "@lix-js/sdk";

/**
 * Renders change control information for a row.
 */
export default function CellGraph(props: {
	activeCellChanges: (Change & {
		comment_count?: string | number | bigint;
	})[];
	activeCell: { col: number; row: number };
}) {
	return (
		<div className="">
			<div className="w-full flex items-center min-h-[54px] gap-1 border-b border-zinc-200">
				<div className=" w-full flex justify-between items-center text-zinc-950 h-9 rounded-lg px-3">
					<div className="flex items-center gap-2">
						<h1 className="font-medium pl-1">Change Graph</h1>
					</div>
				</div>
			</div>

			<div className="mb-12 relative flex flex-col gap-3">
				{props.activeCellChanges.map((change) => {
					return (
						<div
							key={change.id}
							className="relative z-10 flex items-start justify-between text-zinc-500 pr-4 pl-3  mt-4 gap-5"
						>
							<div className="mt-1 w-5 h-5 bg-white flex items-center justify-center rounded-full">
								<div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
							</div>
							<div className="flex-1 flex flex-col gap-1">
								<div className="flex justify-between">
									{/* <div className="">
										<span className="text-zinc-950 font-medium">
											{change.author}
										</span>{" "}
										changed value
									</div> */}
									<p>{timeAgo(change.created_at)}</p>
								</div>
								{Number(change.comment_count) > 0 && (
									<div className="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="1em"
											height="1em"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M5.763 17H20V5H4v13.385zm.692 2L2 22.5V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1z"
											/>
										</svg>
										<p className="text-sm">
											{change.comment_count?.toString()}
										</p>
									</div>
								)}
								{
									// @ts-expect-error - labels is not in the Change type
									change.labels?.length > 0 && (
										<div className="flex gap-1 items-center">
											<SlIcon name="tag"></SlIcon>
											<p>
												{
													// @ts-expect-error - labels is not in the Change type
													change.labels
												}
											</p>
										</div>
									)
								}
								<div className="mt-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded">
									{change.snapshot_content?.text}
								</div>
							</div>
						</div>
					);
				})}
				<div className="absolute w-[2px] h-[calc(100%_-_100px)] top-[20px] left-[21px] bg-zinc-200"></div>
			</div>
		</div>
	);
}
