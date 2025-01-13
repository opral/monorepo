import React, { useEffect, useState, JSX } from "react";
import { Change } from "@lix-js/sdk";
import { lixAtom } from "@/state.ts";
import { useAtom } from "jotai/react";

export const ChangeDiffComponent = (props: {
	change: Change & {
		snapshot_content: Record<string, any> | null;
		parent_snapshot_content: Record<string, any> | null;
	};
	className?: string;
}) => {
	const [lix] = useAtom(lixAtom);
	const [DiffComponent, setDiffComponent] = useState<JSX.Element | null>(null);

	useEffect(() => {
		loadDiffComponent();
	}, [lix]);

	const loadDiffComponent = async () => {
		if (lix) {
			const schemaKey = props.change.schema_key;
			const plugin = (await lix.plugin.getAll()).find((p) =>
				p.diffUiComponents?.some((c) => c.schema_key === schemaKey)
			);
			const component = plugin?.diffUiComponents?.find(
				(c) => c.schema_key === schemaKey
			)?.component;
			if (component) {
				// Dynamically define the custom element (if not already defined)
				if (!customElements.get(`diff-${schemaKey}`)) {
					customElements.define(
						`diff-${schemaKey}`,
						component.constructor as typeof HTMLElement
					);
				}

				setDiffComponent(() => {
					const WrappedComponent = (props: {
						snapshotBefore: Record<string, any> | null;
						snapshotAfter: Record<string, any> | null;
					}) => {
						return React.createElement(`diff-${schemaKey}`, props);
					};

					return React.createElement(WrappedComponent, {
						snapshotBefore: props.change.parent_snapshot_content,
						snapshotAfter: props.change.snapshot_content,
					});
				});
			}
			// Todo: add fallback component
		}
	};

	return (
		<div className={props.className}>
			{DiffComponent && <>{DiffComponent}</>}
		</div>
	);
};
