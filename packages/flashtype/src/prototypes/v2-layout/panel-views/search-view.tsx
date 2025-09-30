/**
 * Search view - Quickly locate files, symbols, or commands
 */
export function SearchView() {
	return (
		<div className="space-y-3 text-[13px] text-[#33384a]">
			<label className="grid gap-1 text-xs font-medium text-[#6f7586]">
				Query
				<input
					placeholder="Search project..."
					className="rounded-md border border-[#d3d7e2] bg-[#fdfdff] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c5d2]"
				/>
			</label>
			<div className="space-y-1">
				<div className="text-xs uppercase tracking-[0.08em] text-[#7a7f8f]">
					Suggestions
				</div>
				<ul className="space-y-1">
					<li className="rounded-md px-2 py-1 hover:bg-[#edeff5]">
						Show recently edited files
					</li>
					<li className="rounded-md px-2 py-1 hover:bg-[#edeff5]">
						Find TODO annotations
					</li>
					<li className="rounded-md px-2 py-1 hover:bg-[#edeff5]">
						Open flashtype config
					</li>
				</ul>
			</div>
		</div>
	);
}
