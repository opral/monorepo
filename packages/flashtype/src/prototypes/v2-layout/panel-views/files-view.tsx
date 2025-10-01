/**
 * Files view - Browse and pin project documents
 */
export function FilesView() {
	return (
		<ul className="space-y-1 text-[13px] text-onsurface-primary">
			<li className="rounded px-2 py-1 hover:bg-surface-300">
				<span>writing-style.md</span>
			</li>
			<li className="rounded px-2 py-1 hover:bg-surface-300">
				<span>README.md</span>
			</li>
			<li className="rounded px-2 py-1 hover:bg-surface-300">
				<span>docs/architecture.mdx</span>
			</li>
		</ul>
	);
}
