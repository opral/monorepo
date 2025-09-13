import * as React from "react";

/**
 * PromptStack owns the layout for the review header, input, and the
 * expanded command/mention UI (rendered below the input).
 *
 * It centralizes width, alignment, and borders to avoid duplicated styling
 * across parent/child components.
 */
export function PromptStack({
	header,
	children,
	className,
}: {
	header?: React.ReactNode;
	/**
	 * Render-prop receives a stable `renderBelow(node)` callback used by the
	 * input to surface the expanded menu/mention UI.
	 */
	children: (api: {
		renderBelow: (node: React.ReactNode) => void;
	}) => React.ReactNode;
	className?: string;
}) {
	const [below, setBelow] = React.useState<React.ReactNode | null>(null);
	const renderBelow = React.useCallback((node: React.ReactNode) => {
		setBelow(node);
	}, []);

	return (
		<div
			className={[
				"mx-auto max-w-[720px] w-full overflow-hidden",
				className ?? "",
			].join(" ")}
		>
			{header ? (
				<div className="w-full border-y border-border">{header}</div>
			) : null}
			{children({ renderBelow })}
			{below ? <div className="px-3 pb-2">{below}</div> : null}
		</div>
	);
}
