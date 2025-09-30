import { FileText } from "lucide-react";

/**
 * Bottom status ribbon mirroring Fleet's understated footer.
 *
 * @example
 * <StatusBar />
 */
export function StatusBar() {
	return (
		<footer className="flex h-11 items-center border-t border-[#d9dce3] bg-[#f8f9fb] px-6 text-xs text-[#6f7586]">
			<div className="flex items-center gap-3">
				<span className="flex items-center gap-1 font-medium text-[#2d3140]">
					<FileText className="h-3.5 w-3.5" />
					writing-style.md
				</span>
				<span className="text-[#c5c9d8]">•</span>
				<span>main · synced moments ago</span>
			</div>
			<div className="ml-auto flex items-center gap-4">
				<span>23:1</span>
				<span>UTF-8</span>
				<span>Markdown</span>
			</div>
		</footer>
	);
}
