/**
 * Tasks view - Track the current sprint notes
 */
export function TasksView() {
	return (
		<div className="space-y-2 text-[13px] text-neutral-900">
			<ul className="space-y-2">
				<li className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Polish layout prototype</span>
						<span className="text-xs text-neutral-400">In progress</span>
					</div>
					<p className="text-xs text-neutral-600">
						Review padding and responsiveness before demo.
					</p>
				</li>
				<li className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Sync with design</span>
						<span className="text-xs text-neutral-400">Todo</span>
					</div>
					<p className="text-xs text-neutral-600">
						Align neutral palette with Fleet islands guidance.
					</p>
				</li>
			</ul>
		</div>
	);
}
