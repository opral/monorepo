import { useCallback } from "react";
import { LixProvider, useQueryTakeFirst } from "@lix-js/react-utils";
import type {
	PanelState,
	PanelSide,
	ViewContext,
	ViewDefinition,
} from "./types";
import { PanelV2 } from "./panel-v2";
import { WelcomeScreen } from "./welcome-screen";
import { LandingScreen } from "./landing-screen";

type CentralPanelProps = {
	readonly panel: PanelState;
	readonly onSelectView: (key: string) => void;
	readonly onRemoveView: (key: string) => void;
	readonly viewContext: ViewContext;
	readonly onCreateNewFile?: () => void | Promise<void>;
	readonly isFocused: boolean;
	readonly onFocusPanel: (side: PanelSide) => void;
	readonly onFinalizePendingView?: (key: string) => void;
	readonly leftPanel?: PanelState;
	readonly rightPanel?: PanelState;
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
	leftPanel,
	rightPanel,
}: CentralPanelProps) {
	const finalizePendingIfNeeded = useCallback(
		(key: string) => {
			if (!onFinalizePendingView) return;
			const entry = panel.views.find((view) => view.instance === key);
			if (entry?.isPending) {
				onFinalizePendingView(key);
			}
		},
		[onFinalizePendingView, panel.views],
	);

	const emptyState = (
		<LixProvider lix={viewContext.lix}>
			<EmptyStateContent
				viewContext={viewContext}
				onCreateNewFile={onCreateNewFile}
				leftPanel={leftPanel}
				rightPanel={rightPanel}
				centralPanel={panel}
			/>
		</LixProvider>
	);

	const labelResolver = useCallback(
		(view: ViewDefinition, entry: (typeof panel.views)[number]) =>
			entry.props?.label ?? view.label,
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

/**
 * Content component that checks for files and conditionally renders landing or welcome screen.
 */
function EmptyStateContent({
	viewContext,
	onCreateNewFile,
	leftPanel,
	rightPanel,
	centralPanel,
}: {
	viewContext: ViewContext;
	onCreateNewFile?: () => void | Promise<void>;
	leftPanel?: PanelState;
	rightPanel?: PanelState;
	centralPanel: PanelState;
}) {
	// Check if files exist in lix (excluding AGENTS.md, same query as top bar alpha warning)
	const fileCount = useQueryTakeFirst(({ lix }) =>
		lix.db
			.selectFrom("file")
			.select(({ fn }) => [fn.count<number>("id").as("count")])
			.where("path", "is not", "/AGENTS.md"),
	);

	const hasFiles = (fileCount?.count ?? 0) > 0;

	if (hasFiles) {
		return (
			<WelcomeScreen
				viewContext={viewContext}
				onCreateNewFile={onCreateNewFile}
				leftPanel={leftPanel}
				rightPanel={rightPanel}
				centralPanel={centralPanel}
			/>
		);
	}
	return (
		<LandingScreen context={viewContext} onCreateNewFile={onCreateNewFile} />
	);
}
