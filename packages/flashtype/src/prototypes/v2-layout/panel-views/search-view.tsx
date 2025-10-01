/**
 * Search view - Quickly locate files, symbols, or commands
 */
export function SearchView() {
	return (
		<div className="space-y-3 text-[13px] text-onsurface-primary">
			<label className="grid gap-1 text-xs font-medium text-onsurface-secondary">
				Query
				<input
					placeholder="Search project..."
					className="rounded-md border border-stroke-200 bg-surface-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
				/>
			</label>
			<div className="space-y-1">
				<div className="text-xs uppercase tracking-[0.08em] text-onsurface-tertiary">
					Suggestions
				</div>
				<ul className="space-y-1">
					<li className="rounded-md px-2 py-1 hover:bg-surface-300">
						Show recently edited files
					</li>
					<li className="rounded-md px-2 py-1 hover:bg-surface-300">
						Find TODO annotations
					</li>
					<li className="rounded-md px-2 py-1 hover:bg-surface-300">
						Open flashtype config
					</li>
				</ul>
			</div>
		</div>
	);
}
