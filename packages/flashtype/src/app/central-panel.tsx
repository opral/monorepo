import { useCallback } from "react";
import type {
	PanelState,
	PanelSide,
	ViewContext,
	ViewDefinition,
} from "./types";
import { PanelV2 } from "./panel-v2";
import { WelcomeScreen } from "./welcome-screen";

type CentralPanelProps = {
	readonly panel: PanelState;
	readonly onSelectView: (instanceKey: string) => void;
	readonly onRemoveView: (instanceKey: string) => void;
	readonly viewContext?: ViewContext;
	readonly onCreateNewFile?: () => void | Promise<void>;
	readonly isFocused: boolean;
	readonly onFocusPanel: (side: PanelSide) => void;
	readonly onFinalizePendingView?: (instanceKey: string) => void;
};

/**
 * Central panel - the main content area between left and right panels.
 *
 * @example
 * <CentralPanel
 *   panel={centralPanel}
 *   onSelectView={handleSelect}
 *   onRemoveView={handleRemove}
 *   onCreateNewFile={() => console.log("create")}
 * />
 */
export function CentralPanel({
	panel,
	onSelectView,
	onRemoveView,
	viewContext,
	isFocused,
	onFocusPanel,
	onFinalizePendingView,
	onCreateNewFile,
}: CentralPanelProps) {
	const finalizePendingIfNeeded = useCallback(
		(instanceKey: string) => {
			if (!onFinalizePendingView) return;
			const entry = panel.views.find(
				(view) => view.instanceKey === instanceKey,
			);
			if (entry?.isPending) {
				onFinalizePendingView(instanceKey);
			}
		},
		[onFinalizePendingView, panel.views],
	);

	const emptyState = <WelcomeScreen onCreateNewFile={onCreateNewFile} />;

	const labelResolver = useCallback(
		(view: ViewDefinition, entry: (typeof panel.views)[number]) =>
			entry.metadata?.label ?? view.label,
		[],
	);

	return (
		<PanelV2
			side="central"
			panel={panel}
			isFocused={isFocused}
			onFocusPanel={onFocusPanel}
			onSelectView={onSelectView}
			onRemoveView={onRemoveView}
			viewContext={viewContext}
			tabLabel={labelResolver}
			onActiveViewInteraction={finalizePendingIfNeeded}
			emptyStatePlaceholder={emptyState}
			dropId="central-panel"
		/>
	);
}
