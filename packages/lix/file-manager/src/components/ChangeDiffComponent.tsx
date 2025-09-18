import { useEffect, useState } from "react";
import type { RenderDiffArgs } from "@lix-js/sdk";
import { lixAtom } from "@/state.ts";
import { useAtom } from "jotai/react";
import clsx from "clsx";

export const ChangeDiffComponent = (props: {
	diffs: RenderDiffArgs["diffs"];
	className?: string;
	contentClassName?: string;
	debug?: boolean;
}) => {
	const [lix] = useAtom(lixAtom);
	const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
	const pluginKey = props.diffs[0]?.plugin_key;

	useEffect(() => {
		let cancelled = false;

		const loadDiff = async () => {
			if (!lix || !pluginKey || props.diffs.length === 0) {
				if (!cancelled) setRenderedHtml(null);
				return;
			}

			try {
				const plugin = (await lix.plugin.getAll()).find(
					(p) => p.key === pluginKey,
				);
				if (!plugin?.renderDiff) {
					if (!cancelled) setRenderedHtml(null);
					return;
				}

				const html = await plugin.renderDiff({ diffs: props.diffs });
				if (!cancelled) setRenderedHtml(html ?? null);
			} catch (error) {
				console.error("Failed to render diff", error);
				if (!cancelled) setRenderedHtml(null);
			}
		};

		loadDiff();

		return () => {
			cancelled = true;
		};
	}, [lix, pluginKey, props.diffs]);

	if (!renderedHtml && !props.debug) {
		return null;
	}

	return (
		<div className={clsx("w-full overflow-x-auto pb-4", props.className)}>
			{renderedHtml && (
				<div
					className={props.contentClassName}
					dangerouslySetInnerHTML={{ __html: renderedHtml }}
				/>
			)}
			{props.debug && (
				<pre className="text-xs text-gray-500 whitespace-pre-wrap break-all">
					{JSON.stringify(props.diffs, null, 2)}
				</pre>
			)}
		</div>
	);
};
