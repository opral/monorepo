/**
 * Tasks view - Track the current sprint notes
 */
export function TasksView() {
	return (
		<div className="space-y-2 text-[13px] text-onsurface-primary">
			<ul className="space-y-2">
				<li className="rounded-lg border border-stroke-200 bg-surface-200 px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Polish layout prototype</span>
						<span className="text-xs text-onsurface-tertiary">In progress</span>
					</div>
					<p className="text-xs text-onsurface-secondary">
						Review padding and responsiveness before demo.
					</p>
				</li>
				<li className="rounded-lg border border-stroke-200 bg-surface-200 px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Sync with design</span>
						<span className="text-xs text-onsurface-tertiary">Todo</span>
					</div>
					<p className="text-xs text-onsurface-secondary">
						Align neutral palette with Fleet islands guidance.
					</p>
				</li>
			</ul>
		</div>
	);
}
