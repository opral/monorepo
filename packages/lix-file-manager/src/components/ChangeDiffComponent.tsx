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
			const pluginKey = props.change.plugin_key;
			const component = (await lix.plugin.getAll()).find(
				(p) => p.key === pluginKey
			)?.diffUiComponent;

			// replace _ with - in custom element name
			const customElementName = `diff-${pluginKey.replace(/_/g, "-")}`;

			if (component) {
				const isRegistered = customElements.get(customElementName);

				if (!isRegistered) {
					const ElementConstructor = component;
					if (typeof ElementConstructor === 'function' &&
						ElementConstructor.prototype instanceof HTMLElement) {
						customElements.define(customElementName, ElementConstructor as CustomElementConstructor);
					} else {
						console.error(`The component constructor for plugin key '${pluginKey}' is invalid.`);
						return;
					}
				}

				setDiffComponent(() => {
					const WrappedComponent = (props: {
						snapshotBefore: Record<string, any> | null;
						snapshotAfter: Record<string, any> | null;
					}) => {
						return React.createElement(customElementName, props);
					};

					return React.createElement(WrappedComponent, {
						snapshotBefore: props.change.parent_snapshot_content,
						snapshotAfter: props.change.snapshot_content,
					});
				});
			} else {
				console.warn(`No diff UI component found for plugin key '${customElementName}'`);
				// Fallback logic
			}
		}
	};

	return (
		<div className={props.className}>
			{DiffComponent && <>{DiffComponent}</>}
		</div>
	);
};