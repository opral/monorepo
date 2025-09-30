/**
 * Tasks view - Track the current sprint notes
 */
export function TasksView() {
	return (
		<div className="space-y-2 text-[13px] text-[#33384a]">
			<ul className="space-y-2">
				<li className="rounded-lg border border-[#d9dce3] bg-[#fdfdff] px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Polish layout prototype</span>
						<span className="text-xs text-[#7a7f8f]">In progress</span>
					</div>
					<p className="text-xs text-[#6f7586]">
						Review padding and responsiveness before demo.
					</p>
				</li>
				<li className="rounded-lg border border-[#d9dce3] bg-[#fdfdff] px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Sync with design</span>
						<span className="text-xs text-[#7a7f8f]">Todo</span>
					</div>
					<p className="text-xs text-[#6f7586]">
						Align neutral palette with Fleet islands guidance.
					</p>
				</li>
			</ul>
		</div>
	);
}
