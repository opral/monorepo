import { FileText } from "lucide-react";

/**
 * Bottom status ribbon displaying lint and sync feedback.
 *
 * @example
 * <StatusBar activePath="/docs/hello.md" />
 */
export function StatusBar(props: { activePath?: string | null }) {
	const label =
		typeof props.activePath === "string" && props.activePath.length > 0
			? props.activePath
			: null;

	return (
		<footer className="flex h-8 items-center px-3 text-xs text-neutral-600">
			{label ? (
				<span className="flex min-w-0 items-center gap-1 font-medium text-neutral-900">
					<FileText className="h-3.5 w-3.5 shrink-0" />
					<span className="truncate">{label}</span>
				</span>
			) : null}
		</footer>
	);
}
