import { useEffect, useRef, useState } from "react";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { useLix } from "@lix-js/react-utils";

export function Diff(props: {
	diffs: UiDiffComponentProps["diffs"];
	className?: string;
	contentClassName?: string;
}) {
	const lix = useLix();
	const [ready, setReady] = useState(false);
	const elRef = useRef<any>(null);
	const pluginKey = props.diffs?.[0]?.plugin_key;
	const CustomElementName = pluginKey
		? `diff-${String(pluginKey).replace(/_/g, "-")}`
		: null;

	useEffect(() => {
		const load = async () => {
			if (!lix || !pluginKey || !CustomElementName) {
				setReady(false);
				return;
			}
			const comp = (await lix.plugin.getAll()).find(
				(p) => p.key === pluginKey,
			)?.diffUiComponent;
			if (comp && !customElements.get(CustomElementName)) {
				customElements.define(CustomElementName, comp);
			}
			setReady(true);
		};
		load();
	}, [lix, pluginKey, CustomElementName]);

	// Ensure complex prop is set as a property (React sets attributes by default on custom elements)
	useEffect(() => {
		if (ready && elRef.current) elRef.current.diffs = props.diffs;
	}, [ready, props.diffs]);

	if (!ready || !CustomElementName) return null;

	const AnyTag: any = CustomElementName;
	return (
		<div className={props.className}>
			<div className={props.contentClassName}>
				<AnyTag ref={elRef} />
			</div>
		</div>
	);
}
