import { Change, Snapshot } from "@lix-js/sdk";

export default function RowDiff(props: {
	uniqueColumnValue: string;
	changes: (Change & {
		snapshot_content: Snapshot["content"];
		parent: Change & { snapshot_content: Snapshot["content"] };
	})[];
}) {
	return (
		<div className="bg-zinc-50 border border-zinc-200 rounded-md pt-2 px-3 pb-4">
			<div className="flex flex-wrap md:flex-nowrap overflow-x-scroll gap-x-1 gap-y-2 md:gap-y-8">
				<div className="flex md:flex-col items-center w-full md:w-auto">
					<p className="hidden md:block text-zinc-500 md:py-1.5 w-[140px] line-clamp-1 whitespace-nowrap text-[14px]">
						UNIQUE VALUE
					</p>
					<p className="md:px-4 md:py-1.5 md:bg-white md:border border-zinc-200 md:w-[140px] rounded-full md:mr-4 overflow-hidden whitespace-nowrap text-ellipsis">
						{props.uniqueColumnValue}
					</p>
				</div>
				{props.changes.map((change) => {
					const column = change.entity_id.split("|")[2];
					const value = change.snapshot_content?.text;
					const parentValue = change.parent?.snapshot_content?.text;

					return (
						<div
							key={column}
							className="flex md:flex-col flex-wrap md:flex-nowrap items-center w-full md:w-auto"
						>
							<p className="text-zinc-500 py-1 md:py-1.5 w-full md:w-[140px] uppercase text-[14px] overflow-hidden whitespace-nowrap text-ellipsis">
								{column}
							</p>
							{value ? (
								// insert or update
								<p className="px-3 py-1.5 bg-white border border-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
									{value}
								</p>
							) : (
								// deletion
								<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
							)}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								className="text-zinc-400 m-1 -rotate-90 md:rotate-0"
							>
								<path
									fill="currentColor"
									d="M11 20h2V8l5.5 5.5l1.42-1.42L12 4.16l-7.92 7.92L5.5 13.5L11 8z"
								/>
							</svg>
							{parentValue ? (
								// insert or update
								<p className="px-3 py-1.5 bg-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
									{parentValue}
								</p>
							) : (
								// non-existent
								<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
