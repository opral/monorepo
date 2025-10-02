import type { ViewContext } from "../../types";

type FilesViewProps = {
	readonly context?: ViewContext;
};

/**
 * Files view - Browse and pin project documents
 */
export function FilesView({ context }: FilesViewProps) {
	const handleFileClick = (fileName: string) => {
		context?.onOpenFile?.(fileName);
	};

	return (
		<ul className="space-y-1 text-[13px] text-neutral-900">
			<li
				className="rounded px-2 py-1 hover:bg-neutral-100 cursor-pointer"
				onClick={() => handleFileClick("writing-style.md")}
			>
				<span>writing-style.md</span>
			</li>
			<li
				className="rounded px-2 py-1 hover:bg-neutral-100 cursor-pointer"
				onClick={() => handleFileClick("README.md")}
			>
				<span>README.md</span>
			</li>
			<li
				className="rounded px-2 py-1 hover:bg-neutral-100 cursor-pointer"
				onClick={() => handleFileClick("docs/architecture.mdx")}
			>
				<span>docs/architecture.mdx</span>
			</li>
		</ul>
	);
}
