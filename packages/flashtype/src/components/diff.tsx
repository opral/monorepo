import { useEffect, useState } from "react";
import type { RenderDiffArgs } from "@lix-js/sdk";
import { useLix } from "@lix-js/react-utils";

export function Diff(props: {
	diffs: RenderDiffArgs["diffs"];
	className?: string;
	contentClassName?: string;
}) {
	const lix = useLix();
	const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
	const pluginKey = props.diffs?.[0]?.plugin_key;

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			if (!lix || !pluginKey) {
				if (!cancelled) setRenderedHtml(null);
				return;
			}

			try {
				const plugins = await lix.plugin.getAll();
				const plugin = plugins[0];
				if (cancelled) return;
				if (!plugin?.renderDiff) {
					setRenderedHtml(null);
					return;
				}

				const html = await plugin.renderDiff({ diffs: props.diffs });
				if (!cancelled) setRenderedHtml(html ?? null);
			} catch (error) {
				if (!cancelled) {
					console.error("Failed to render diff", error);
					setRenderedHtml(null);
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [lix, pluginKey, props.diffs]);

	if (!renderedHtml) return null;

	const contentClasses = ["lix-diff-content", props.contentClassName]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={props.className}>
			<div
				className={contentClasses}
				dangerouslySetInnerHTML={{ __html: renderedHtml }}
			/>
		</div>
	);
}
