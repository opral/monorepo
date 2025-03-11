import { useEffect, useState } from "react";
import { UiDiffComponentProps } from "@lix-js/sdk";
import { lixAtom } from "@/state.ts";
import { useAtom } from "jotai/react";
import clsx from "clsx";

export const ChangeDiffComponent = (props: {
	diffs: UiDiffComponentProps["diffs"];
	className?: string;
}) => {
	console.log("ChangeDiffComponent", props);
	const [lix] = useAtom(lixAtom);
	const [isComponentLoaded, setIsComponentLoaded] = useState(false);

	const pluginKey = props.diffs[0]?.plugin_key;
	const CustomElementName = `diff-${pluginKey.replace(/_/g, "-")}`;

	useEffect(() => {
		const loadDiffComponent = async () => {
			const component = (await lix.plugin.getAll()).find(
				(p) => p.key === pluginKey
			)?.diffUiComponent;

			if (!customElements.get(CustomElementName)) {
				if (component) {
					customElements.define(CustomElementName, component);
					setIsComponentLoaded(true);
					} else {
					console.warn(`No diff UI component found for plugin key '${pluginKey}'`);
					// Fallback logic
					}
			} else {
				setIsComponentLoaded(true);
			}
		};

		loadDiffComponent();
	}, [lix, pluginKey]);

	if (!isComponentLoaded) {
		return null;
	}

	return (
		<div className={clsx("w-full overflow-x-auto pb-4", props.className)}>
			<CustomElementName
				// @ts-expect-error - Custom element props
				diffs={props.diffs}
			/>
		</div>
	);
};
