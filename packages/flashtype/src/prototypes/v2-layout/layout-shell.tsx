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
import { SidePanel } from "./side-panel";
import { CentralPanel } from "./central-panel";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import type {
	PanelSide,
	PanelState,
	ViewInstance,
	ViewKey,
	DiffViewConfig,
	RenderableDiff,
} from "./types";
import { createViewInstanceKey, VIEW_MAP } from "./view-registry";
import { Panel as PanelComponent } from "./panel";
import {
	DEFAULT_FLASHTYPE_UI_STATE,
	FLASHTYPE_UI_STATE_KEY,
	normalizeLayoutSizes,
	type PanelLayoutSizes,
	type FlashtypeUiState,
} from "./ui-state";
import { activatePanelView, upsertPendingView } from "./pending-view";

const hydratePanel = (panel: PanelState): PanelState => {
	const views = panel.views.map(upgradeDiffMetadata);
	if (views.length === 0) {
		return { views, activeInstanceKey: null };
	}
	const fallbackActive = views[0]?.instanceKey ?? null;
	const hasDesiredActive = panel.activeInstanceKey
		? views.some((view) => view.instanceKey === panel.activeInstanceKey)
		: false;
	return {
		views,
		activeInstanceKey: hasDesiredActive
			? panel.activeInstanceKey
			: fallbackActive,
	};
};

const upgradeDiffMetadata = (view: ViewInstance): ViewInstance => {
	if (view.viewKey !== "diff") return view;
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
				eb.fn
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

	const [leftPanel, setLeftPanel] = useState<PanelState>(() => {
		const existing = persistedState.panels.left;
		if (existing.views.length > 0) {
			return hydratePanel(existing);
		}
		const defaultViews: ViewInstance[] = [
			{ instanceKey: createViewInstanceKey("files"), viewKey: "files" },
			{ instanceKey: createViewInstanceKey("search"), viewKey: "search" },
		];
		return hydratePanel({
			views: defaultViews,
			activeInstanceKey:
				existing.activeInstanceKey ?? defaultViews[0]?.instanceKey ?? null,
		});
	});
	const [centralPanel, setCentralPanel] = useState<PanelState>(() =>
		hydratePanel(persistedState.panels.central),
	);
	const [rightPanel, setRightPanel] = useState<PanelState>(() =>
		hydratePanel(persistedState.panels.right),
	);
	const [focusedPanel, setFocusedPanel] = useState<PanelSide>(
		() => persistedState.focusedPanel,
	);
	const [panelSizes, setPanelSizes] = useState<PanelLayoutSizes>(
		() => initialLayoutSizes,
	);

	const lastPersistedRef = useRef<string>(
		JSON.stringify({
			focusedPanel: persistedState.focusedPanel,
			panels: persistedState.panels,
			layout: { sizes: initialLayoutSizes },
		} satisfies FlashtypeUiState),
	);
	const pendingPersistRef = useRef<string | null>(null);
	const hydratingRef = useRef(false);

	useEffect(() => {
		if (!uiStateKV) return;
		const serialized = JSON.stringify(uiStateKV);
		if (serialized === lastPersistedRef.current) {
			if (pendingPersistRef.current === serialized) {
				pendingPersistRef.current = null;
			}
			return;
		}
		hydratingRef.current = true;
		lastPersistedRef.current = serialized;
		setLeftPanel(hydratePanel(uiStateKV.panels.left));
		setCentralPanel(hydratePanel(uiStateKV.panels.central));
		setRightPanel(hydratePanel(uiStateKV.panels.right));
		setFocusedPanel(uiStateKV.focusedPanel);
		setPanelSizes(normalizeLayoutSizes(uiStateKV.layout?.sizes));
		queueMicrotask(() => {
			hydratingRef.current = false;
			if (pendingPersistRef.current === serialized) {
				pendingPersistRef.current = null;
			}
		});
	}, [uiStateKV]);

	useEffect(() => {
		if (hydratingRef.current) return;
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
	}, [
		leftPanel,
		centralPanel,
		rightPanel,
		focusedPanel,
		panelSizes,
		setUiStateKV,
	]);

	const panels = useMemo(
		() => ({ left: leftPanel, central: centralPanel, right: rightPanel }),
		[leftPanel, centralPanel, rightPanel],
	);

	const setPanelState = (
		side: PanelSide,
		reducer: (state: PanelState) => PanelState,
		options: { focus?: boolean } = {},
	) => {
		const applyReducer = (prev: PanelState) =>
			hydratePanel(reducer(hydratePanel(prev)));
		if (side === "left") {
			setLeftPanel(applyReducer);
		} else if (side === "central") {
			setCentralPanel(applyReducer);
		} else {
			setRightPanel(applyReducer);
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
			| { instanceKey: string; viewKey: ViewKey; fromPanel: PanelSide }
			| undefined;
		const dropData = over.data.current as { panel: PanelSide } | undefined;

		if (!dragData || !dropData) return;

		const { instanceKey, viewKey: _viewKey, fromPanel } = dragData;
		const { panel: toPanel } = dropData;
		const sourcePanel = panels[fromPanel];
		const movedView = sourcePanel.views.find(
			(entry) => entry.instanceKey === instanceKey,
		);
		if (!movedView) return;

		// Remove from source panel
		setPanelState(fromPanel, (panel) => ({
			views: panel.views.filter((entry) => entry.instanceKey !== instanceKey),
			activeInstanceKey:
				panel.activeInstanceKey === instanceKey
					? null
					: panel.activeInstanceKey,
		}));

		// Add to target panel
		setPanelState(
			toPanel,
			(panel) => {
				const newView = movedView;
				return {
					views: [...panel.views, newView],
					activeInstanceKey: newView.instanceKey,
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
			].find((view) => view.instanceKey === activeId)
		: null;
	const activeDragView = activeDragData
		? VIEW_MAP.get(activeDragData.viewKey)
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
				(panel) => activatePanelView(panel, existingFileView.instanceKey),
				{ focus: shouldFocus },
			);
		} else {
			const encodedLabel =
				filePath.split("/").filter(Boolean).pop() ?? filePath;
			const label = decodeURIComponentSafe(encodedLabel);
			const newView: ViewInstance = {
				instanceKey: createViewInstanceKey("file-content"),
				viewKey: "file-content" as ViewKey,
				isPending: true,
				metadata: {
					filePath,
					label,
				},
			};

			setPanelState("central", (panel) => upsertPendingView(panel, newView), {
				focus: shouldFocus,
			});
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
				(panel) => activatePanelView(panel, existingCommitView.instanceKey),
				{ focus: shouldFocus },
			);
		} else {
			const newView: ViewInstance = {
				instanceKey: createViewInstanceKey("commit"),
				viewKey: "commit" as ViewKey,
				isPending: true,
				metadata: {
					checkpointId,
					label,
				},
			};

			setPanelState("central", (panel) => upsertPendingView(panel, newView), {
				focus: shouldFocus,
			});
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
			(view) => view.viewKey === "diff" && view.metadata?.fileId === fileId,
		);
		const diffLabel = diffLabelFromPath(filePath) ?? filePath;
		const diffConfig = createWorkingVsCheckpointDiffConfig(fileId, diffLabel);

		if (existingDiffView) {
			setPanelState(
				"central",
				(panel) => {
					const nextViews = panel.views.map((entry) =>
						entry.instanceKey === existingDiffView.instanceKey
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
						activeInstanceKey: existingDiffView.instanceKey,
					};
				},
				{ focus: shouldFocus },
			);
			return;
		}

		const newView: ViewInstance = {
			instanceKey: createViewInstanceKey("diff"),
			viewKey: "diff",
			isPending: true,
			metadata: {
				fileId,
				filePath,
				label: diffLabel,
				diff: diffConfig,
			},
		};

		setPanelState("central", (panel) => upsertPendingView(panel, newView), {
			focus: shouldFocus,
		});
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
						<Panel defaultSize={panelSizes.left} minSize={10} maxSize={40}>
							<SidePanel
								side="left"
								title="Navigator"
								panel={hydratedLeft}
								isFocused={focusedPanel === "left"}
								onFocusPanel={focusPanel}
								onSelectView={(instanceKey) =>
									setPanelState(
										"left",
										(panel) => ({
											views: panel.views,
											activeInstanceKey: instanceKey,
										}),
										{ focus: true },
									)
								}
								onAddView={(viewKey) =>
									setPanelState(
										"left",
										(panel) => {
											const next: ViewInstance = {
												instanceKey: createViewInstanceKey(viewKey),
												viewKey,
											};
											return {
												views: [...panel.views, next],
												activeInstanceKey: next.instanceKey,
											};
										},
										{ focus: true },
									)
								}
								onRemoveView={(instanceKey) =>
									setPanelState(
										"left",
										(panel) => {
											const views = panel.views.filter(
												(entry) => entry.instanceKey !== instanceKey,
											);
											const nextActive =
												panel.activeInstanceKey === instanceKey
													? (views[views.length - 1]?.instanceKey ?? null)
													: panel.activeInstanceKey;
											return { views, activeInstanceKey: nextActive };
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
								onSelectView={(instanceKey) =>
									setPanelState(
										"central",
										(panel) => activatePanelView(panel, instanceKey),
										{ focus: true },
									)
								}
								onRemoveView={(instanceKey) =>
									setPanelState(
										"central",
										(panel) => {
											const views = panel.views.filter(
												(entry) => entry.instanceKey !== instanceKey,
											);
											const nextActive =
												panel.activeInstanceKey === instanceKey
													? (views[views.length - 1]?.instanceKey ?? null)
													: panel.activeInstanceKey;
											return { views, activeInstanceKey: nextActive };
										},
										{ focus: true },
									)
								}
								onFinalizePendingView={(instanceKey) =>
									setPanelState(
										"central",
										(panel) => activatePanelView(panel, instanceKey),
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
						<Panel defaultSize={panelSizes.right} minSize={10} maxSize={40}>
							<SidePanel
								side="right"
								title="Secondary"
								panel={hydratedRight}
								isFocused={focusedPanel === "right"}
								onFocusPanel={focusPanel}
								onSelectView={(instanceKey) =>
									setPanelState(
										"right",
										(panel) => ({
											views: panel.views,
											activeInstanceKey: instanceKey,
										}),
										{ focus: true },
									)
								}
								onAddView={(viewKey) =>
									setPanelState(
										"right",
										(panel) => {
											const next: ViewInstance = {
												instanceKey: createViewInstanceKey(viewKey),
												viewKey,
											};
											return {
												views: [...panel.views, next],
												activeInstanceKey: next.instanceKey,
											};
										},
										{ focus: true },
									)
								}
								onRemoveView={(instanceKey) =>
									setPanelState(
										"right",
										(panel) => {
											const views = panel.views.filter(
												(entry) => entry.instanceKey !== instanceKey,
											);
											const nextActive =
												panel.activeInstanceKey === instanceKey
													? (views[views.length - 1]?.instanceKey ?? null)
													: panel.activeInstanceKey;
											return { views, activeInstanceKey: nextActive };
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
