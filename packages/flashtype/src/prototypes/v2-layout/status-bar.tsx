import { FileText } from "lucide-react";

/**
 * Bottom status ribbon mirroring Fleet's understated footer.
 *
 * @example
 * <StatusBar />
 */
export function StatusBar() {
	return (
		<footer className="flex h-8 items-center px-3 text-xs text-neutral-600">
			<div className="flex items-center gap-2">
				<span className="flex items-center gap-1 font-medium text-neutral-900">
					<FileText className="h-3.5 w-3.5" />
					writing-style.md
				</span>
				<span className="text-neutral-200">•</span>
				<span>main</span>
			</div>
			<div className="ml-auto flex items-center gap-3">
				<span>23:1</span>
				<span>UTF-8</span>
				<span>Markdown</span>
			</div>
		</footer>
	);
}
