import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
	DndContext,
	DragOverlay,
	type DragEndEvent,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useKeyValue } from "@/key-value/use-key-value";
import { selectWorkingDiff } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { sql } from "kysely";
import { SidePanel } from "./side-panel";
import { CentralPanel } from "./central-panel";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import type {
	DiffViewConfig,
	PanelSide,
	PanelState,
	PanelView,
	RenderableDiff,
	ViewId,
} from "./types";
import { createViewKey, VIEW_MAP } from "./view-registry";
import { Panel as PanelComponent } from "./panel";
import {
	DEFAULT_FLASHTYPE_UI_STATE,
	FLASHTYPE_UI_STATE_KEY,
	normalizeLayoutSizes,
	type PanelLayoutSizes,
	type FlashtypeUiState,
} from "./ui-state";
import { activatePanelView, upsertPendingView } from "./pending-view";

const hydratePanel = (panel: PanelState): PanelState => ({
	views: panel.views.map(upgradeDiffMetadata),
	activeViewKey:
		panel.views.length === 0
			? null
			: (panel.activeViewKey ?? panel.views[0]?.viewKey ?? null),
});

const upgradeDiffMetadata = (view: PanelView): PanelView => {
	if (view.viewId !== "diff") return view;
	const fileId = view.metadata?.fileId;
	if (!fileId) return view;
	const existing = view.metadata?.diff;
	const nextLabel =
		view.metadata?.label ??
		diffLabelFromPath(view.metadata?.filePath) ??
		"Unnamed diff";
	if (existing?.query && view.metadata?.label === nextLabel) {
		return view;
	}
	return {
		...view,
		metadata: {
			...view.metadata,
			label: nextLabel,
			diff: existing?.query
				? existing
				: createWorkingVsCheckpointDiffConfig(fileId, nextLabel),
		},
	};
};

const diffLabelFromPath = (filePath?: string): string | undefined => {
	if (!filePath) return undefined;
	const encodedLabel = filePath.split("/").filter(Boolean).pop();
	return encodedLabel ? decodeURIComponentSafe(encodedLabel) : undefined;
};

const formatDiffLabel = (base: string): string =>
	base.startsWith("Diff ") ? base : `Diff ${base}`;

const decodeURIComponentSafe = (value: string): string => {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};

const createWorkingVsCheckpointDiffConfig = (
	fileId: string,
	title: string,
): DiffViewConfig => ({
	title,
	query: ({ lix }) =>
		selectWorkingDiff({ lix })
			.where("diff.file_id", "=", fileId)
			.orderBy("diff.entity_id")
			.leftJoin("change as after", "after.id", "diff.after_change_id")
			.leftJoin("change as before", "before.id", "diff.before_change_id")
			.select((eb) => [
				eb.ref("diff.entity_id").as("entity_id"),
				eb.ref("diff.schema_key").as("schema_key"),
				eb.ref("diff.status").as("status"),
				eb.ref("before.snapshot_content").as("before_snapshot_content"),
				eb.ref("after.snapshot_content").as("after_snapshot_content"),
				eb
					.fn
					.coalesce(
						eb.ref("after.plugin_key"),
						eb.ref("before.plugin_key"),
						eb.val(mdPlugin.key),
					)
				.as("plugin_key"),
			])
			.$castTo<RenderableDiff>(),
});

/**
 * Fleet-style layout shell with independent left and right islands.
 *
 * @example
 * <V2LayoutShell />
 */
export function V2LayoutShell() {
	const [uiStateKV, setUiStateKV] = useKeyValue(FLASHTYPE_UI_STATE_KEY);
	const persistedState = uiStateKV ?? DEFAULT_FLASHTYPE_UI_STATE;
	const initialLayoutSizes = normalizeLayoutSizes(persistedState.layout?.sizes);

	const [leftPanel, setLeftPanel] = useState<PanelState>(() =>
		persistedState.panels.left.views.length > 0
			? persistedState.panels.left
			: {
				views: [
					{ viewKey: createViewKey("files"), viewId: "files" },
					{ viewKey: createViewKey("search"), viewId: "search" },
				],
				activeViewKey: persistedState.panels.left.activeViewKey,
			},
	);
	const [centralPanel, setCentralPanel] = useState<PanelState>(
		() => persistedState.panels.central,
	);
	const [rightPanel, setRightPanel] = useState<PanelState>(
		() => persistedState.panels.right,
	);
	const [focusedPanel, setFocusedPanel] = useState<PanelSide>(
		() => persistedState.focusedPanel,
	);
	const [panelSizes, setPanelSizes] = useState<PanelLayoutSizes>(
		() => initialLayoutSizes,
	);

	const lastPersistedRef = useRef<string>(JSON.stringify({
		focusedPanel: persistedState.focusedPanel,
		panels: persistedState.panels,
		layout: { sizes: initialLayoutSizes },
	} satisfies FlashtypeUiState));
	const pendingPersistRef = useRef<string | null>(null);

	useEffect(() => {
		if (!uiStateKV) return;
		const serialized = JSON.stringify(uiStateKV);
		if (serialized === lastPersistedRef.current) {
			if (pendingPersistRef.current === serialized) {
				pendingPersistRef.current = null;
			}
			return;
		}
		lastPersistedRef.current = serialized;
		pendingPersistRef.current = null;
		setLeftPanel(uiStateKV.panels.left);
		setCentralPanel(uiStateKV.panels.central);
		setRightPanel(uiStateKV.panels.right);
		setFocusedPanel(uiStateKV.focusedPanel);
		setPanelSizes(normalizeLayoutSizes(uiStateKV.layout?.sizes));
	}, [uiStateKV]);

	useEffect(() => {
		const nextState: FlashtypeUiState = {
			focusedPanel,
			panels: {
				left: leftPanel,
				central: centralPanel,
				right: rightPanel,
			},
			layout: { sizes: panelSizes },
		};
		const serialized = JSON.stringify(nextState);
		if (
			serialized === lastPersistedRef.current ||
			serialized === pendingPersistRef.current
		) {
			return;
		}
		pendingPersistRef.current = serialized;
		void setUiStateKV(nextState);
	}, [leftPanel, centralPanel, rightPanel, focusedPanel, panelSizes, setUiStateKV]);

	const panels = useMemo(
		() => ({ left: leftPanel, central: centralPanel, right: rightPanel }),
		[leftPanel, centralPanel, rightPanel],
	);

	const setPanelState = (
		side: PanelSide,
		reducer: (state: PanelState) => PanelState,
		options: { focus?: boolean } = {},
	) => {
		if (side === "left") {
			setLeftPanel((prev) => reducer(hydratePanel(prev)));
		} else if (side === "central") {
			setCentralPanel((prev) => reducer(hydratePanel(prev)));
		} else {
			setRightPanel((prev) => reducer(hydratePanel(prev)));
		}
		if (options.focus) {
			setFocusedPanel(side);
		}
	};

	const focusPanel = (side: PanelSide) => setFocusedPanel(side);

	const hydratedLeft = hydratePanel(panels.left);
	const hydratedCentral = hydratePanel(panels.central);
	const hydratedRight = hydratePanel(panels.right);

	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const handleLayoutChange = useCallback((sizes: number[]) => {
		if (sizes.length !== 3) return;
		setPanelSizes((prev) => {
			const next = {
				left: sizes[0],
				central: sizes[1],
				right: sizes[2],
			};
			if (
				prev.left === next.left &&
				prev.central === next.central &&
				prev.right === next.right
			) {
				return prev;
			}
			return next;
		});
	}, []);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveId(null);
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		// Parse drag data
		const dragData = active.data.current as
		| { viewKey: string; viewId: ViewId; fromPanel: PanelSide }
			| undefined;
		const dropData = over.data.current as { panel: PanelSide } | undefined;

		if (!dragData || !dropData) return;

	const { viewKey, viewId, fromPanel } = dragData;
	const { panel: toPanel } = dropData;

	// Remove from source panel
	setPanelState(fromPanel, (panel) => ({
		views: panel.views.filter((entry) => entry.viewKey !== viewKey),
		activeViewKey:
			panel.activeViewKey === viewKey ? null : panel.activeViewKey,
	}));

	// Add to target panel
	setPanelState(
		toPanel,
		(panel) => {
			const newView = { viewKey, viewId };
			return {
				views: [...panel.views, newView],
				activeViewKey: newView.viewKey,
			};
		},
		{ focus: true },
	);
	};

	const activeDragData = activeId
		? [
			...hydratedLeft.views,
			...hydratedCentral.views,
			...hydratedRight.views,
		].find((view) => view.viewKey === activeId)
		: null;
	const activeDragView = activeDragData
		? VIEW_MAP.get(activeDragData.viewId)
		: null;

	const handleOpenFile = (
		filePath: string,
		options?: {
			readonly focus?: boolean;
		},
	) => {
		const shouldFocus = options?.focus ?? true;
		const existingFileView = hydratedCentral.views.find(
			(view) => view.metadata?.filePath === filePath,
		);

		if (existingFileView) {
			setPanelState(
				"central",
				(panel) => activatePanelView(panel, existingFileView.viewKey),
				{ focus: shouldFocus },
			);
		} else {
			const encodedLabel =
				filePath.split("/").filter(Boolean).pop() ?? filePath;
			const label = decodeURIComponentSafe(encodedLabel);
			const newView = {
				viewKey: createViewKey("file-content"),
				viewId: "file-content" as ViewId,
				isPending: true,
				metadata: {
					filePath,
					label,
				},
			};

			setPanelState(
				"central",
				(panel) => upsertPendingView(panel, newView),
				{ focus: shouldFocus },
			);
		}
	};

	const handleOpenCommit = (
		checkpointId: string,
		label: string,
		options?: {
			readonly focus?: boolean;
		},
	) => {
		const shouldFocus = options?.focus ?? true;
		const existingCommitView = hydratedCentral.views.find(
			(view) => view.metadata?.checkpointId === checkpointId,
		);

		if (existingCommitView) {
			setPanelState(
				"central",
				(panel) => activatePanelView(panel, existingCommitView.viewKey),
				{ focus: shouldFocus },
			);
		} else {
			const newView = {
				viewKey: createViewKey("commit"),
				viewId: "commit" as ViewId,
				isPending: true,
				metadata: {
					checkpointId,
					label,
				},
			};

			setPanelState(
				"central",
				(panel) => upsertPendingView(panel, newView),
				{ focus: shouldFocus },
			);
		}
	};

	const handleOpenDiff = (
		fileId: string,
		filePath: string,
		options?: {
			readonly focus?: boolean;
		},
	) => {
		const shouldFocus = options?.focus ?? true;
		const existingDiffView = hydratedCentral.views.find(
			(view) => view.viewId === "diff" && view.metadata?.fileId === fileId,
		);

		const encodedLabel = filePath.split("/").filter(Boolean).pop() ?? filePath;
	const diffLabel = decodeURIComponentSafe(encodedLabel);
	const diffConfig = createWorkingVsCheckpointDiffConfig(fileId, diffLabel);

		if (existingDiffView) {
			setPanelState(
				"central",
				(panel) => {
					const nextViews = panel.views.map((entry) =>
						entry.viewKey === existingDiffView.viewKey
							? {
								...entry,
								isPending: false,
								metadata: {
									fileId,
									filePath,
									label: diffLabel,
									diff: diffConfig,
								},
							}
							: entry,
						);
					return {
						views: nextViews,
						activeViewKey: existingDiffView.viewKey,
					};
				},
				{ focus: shouldFocus },
			);
			return;
		}

		const newView = {
			viewKey: createViewKey("diff"),
			viewId: "diff" as ViewId,
			isPending: true,
			metadata: {
				fileId,
				filePath,
				label: diffLabel,
				diff: diffConfig,
			},
		};

		setPanelState(
			"central",
			(panel) => upsertPendingView(panel, newView),
			{ focus: shouldFocus },
		);
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="flex h-screen flex-col bg-neutral-100 text-neutral-900">
				<TopBar />
				<div className="flex flex-1 overflow-hidden px-2 gap-4">
					<PanelGroup direction="horizontal" onLayout={handleLayoutChange}>
						<Panel
							defaultSize={panelSizes.left}
							minSize={10}
							maxSize={40}
						>
							<SidePanel
								side="left"
								title="Navigator"
								panel={hydratedLeft}
								isFocused={focusedPanel === "left"}
								onFocusPanel={focusPanel}
								onSelectView={(viewKey) =>
									setPanelState(
										"left",
										(panel) => ({
											views: panel.views,
											activeViewKey: viewKey,
										}),
										{ focus: true },
									)
								}
								onAddView={(viewId) =>
									setPanelState(
										"left",
										(panel) => {
											const next = {
												viewKey: createViewKey(viewId),
												viewId,
											};
											return {
												views: [...panel.views, next],
												activeViewKey: next.viewKey,
											};
										},
										{ focus: true },
									)
								}
								onRemoveView={(viewKey) =>
									setPanelState(
										"left",
										(panel) => {
											const views = panel.views.filter(
												(entry) => entry.viewKey !== viewKey,
											);
											const nextActive =
												panel.activeViewKey === viewKey
													? (views[views.length - 1]?.viewKey ?? null)
													: panel.activeViewKey;
											return { views, activeViewKey: nextActive };
										},
										{ focus: true },
									)
								}
									viewContext={{
										onOpenFile: handleOpenFile,
										onOpenCommit: handleOpenCommit,
										onOpenDiff: handleOpenDiff,
									}}
							/>
						</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel defaultSize={panelSizes.central} minSize={30}>
								<CentralPanel
									panel={hydratedCentral}
									isFocused={focusedPanel === "central"}
									onFocusPanel={focusPanel}
									onSelectView={(viewKey) =>
										setPanelState(
											"central",
											(panel) => activatePanelView(panel, viewKey),
											{ focus: true },
										)
									}
									onRemoveView={(viewKey) =>
										setPanelState(
											"central",
											(panel) => {
												const views = panel.views.filter(
													(entry) => entry.viewKey !== viewKey,
												);
												const nextActive =
													panel.activeViewKey === viewKey
														? (views[views.length - 1]?.viewKey ?? null)
														: panel.activeViewKey;
												return { views, activeViewKey: nextActive };
											},
											{ focus: true },
										)
									}
									onFinalizePendingView={(viewKey) =>
									setPanelState(
										"central",
										(panel) => activatePanelView(panel, viewKey),
										{ focus: true },
									)
								}
									viewContext={{
										onOpenFile: handleOpenFile,
										onOpenCommit: handleOpenCommit,
										onOpenDiff: handleOpenDiff,
									}}
							/>
							</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel
							defaultSize={panelSizes.right}
							minSize={10}
							maxSize={40}
						>
							<SidePanel
								side="right"
								title="Secondary"
								panel={hydratedRight}
								isFocused={focusedPanel === "right"}
								onFocusPanel={focusPanel}
								onSelectView={(viewKey) =>
									setPanelState(
										"right",
										(panel) => ({
											views: panel.views,
											activeViewKey: viewKey,
										}),
										{ focus: true },
									)
								}
								onAddView={(viewId) =>
									setPanelState(
										"right",
										(panel) => {
											const next = {
												viewKey: createViewKey(viewId),
												viewId,
											};
											return {
												views: [...panel.views, next],
												activeViewKey: next.viewKey,
											};
										},
										{ focus: true },
									)
								}
								onRemoveView={(viewKey) =>
									setPanelState(
										"right",
										(panel) => {
											const views = panel.views.filter(
												(entry) => entry.viewKey !== viewKey,
											);
											const nextActive =
												panel.activeViewKey === viewKey
													? (views[views.length - 1]?.viewKey ?? null)
													: panel.activeViewKey;
											return { views, activeViewKey: nextActive };
										},
										{ focus: true },
									)
								}
									viewContext={{
										onOpenFile: handleOpenFile,
										onOpenCommit: handleOpenCommit,
										onOpenDiff: handleOpenDiff,
									}}
							/>
						</Panel>
					</PanelGroup>
				</div>
				<StatusBar />
			</div>
			<DragOverlay>
				{activeId && activeDragView ? (
					<div className="cursor-grabbing">
						<PanelComponent.Tab
							icon={activeDragView.icon}
							label={activeDragView.label}
							isActive={true}
							isFocused={true}
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
