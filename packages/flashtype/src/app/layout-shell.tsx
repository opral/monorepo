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
import { useKeyValue } from "@/hooks/key-value/use-key-value";
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
	if (!uiStateKV) {
		throw new Error("Flashtype UI state is unavailable.");
	}

	const initialLayoutSizes = normalizeLayoutSizes(uiStateKV.layout?.sizes);

	const [leftPanel, setLeftPanel] = useState<PanelState>(() => {
		const existing = uiStateKV.panels.left;
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
		hydratePanel(uiStateKV.panels.central),
	);
	const [rightPanel, setRightPanel] = useState<PanelState>(() =>
		hydratePanel(uiStateKV.panels.right),
	);
	const [focusedPanel, setFocusedPanel] = useState<PanelSide>(
		() => uiStateKV.focusedPanel,
	);
	const [panelSizes, setPanelSizes] = useState<PanelLayoutSizes>(
		() => initialLayoutSizes,
	);

	const lastPersistedRef = useRef<string>(
		JSON.stringify({
			focusedPanel: uiStateKV.focusedPanel,
			panels: uiStateKV.panels,
			layout: { sizes: initialLayoutSizes },
		} satisfies FlashtypeUiState),
	);
	const pendingPersistRef = useRef<string | null>(null);
	const hydratingRef = useRef(false);

	useEffect(() => {
		if (!uiStateKV) return;
		const serialized = JSON.stringify(uiStateKV);
		if (
			serialized === lastPersistedRef.current ||
			serialized === pendingPersistRef.current
		) {
			lastPersistedRef.current = serialized;
			if (pendingPersistRef.current === serialized) {
				pendingPersistRef.current = null;
			}
			return;
		}
		hydratingRef.current = true;
		lastPersistedRef.current = serialized;
		setLeftPanel((prev) =>
			prev === uiStateKV.panels.left
				? prev
				: hydratePanel(uiStateKV.panels.left),
		);
		setCentralPanel((prev) =>
			prev === uiStateKV.panels.central
				? prev
				: hydratePanel(uiStateKV.panels.central),
		);
		setRightPanel((prev) =>
			prev === uiStateKV.panels.right
				? prev
				: hydratePanel(uiStateKV.panels.right),
		);
		setFocusedPanel((prev) =>
			prev === uiStateKV.focusedPanel ? prev : uiStateKV.focusedPanel,
		);
		setPanelSizes((prev) => {
			const next = normalizeLayoutSizes(uiStateKV.layout?.sizes);
			if (
				prev.left === next.left &&
				prev.central === next.central &&
				prev.right === next.right
			) {
				return prev;
			}
			return next;
		});
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
		const timeoutId = setTimeout(() => {
			void setUiStateKV(nextState);
		}, 200);
		return () => {
			clearTimeout(timeoutId);
			if (pendingPersistRef.current === serialized) {
				pendingPersistRef.current = null;
			}
		};
	}, [
		leftPanel,
		centralPanel,
		rightPanel,
		focusedPanel,
		panelSizes,
		setUiStateKV,
	]);

	const setPanelState = useCallback(
		(
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
				setFocusedPanel((prev) => (prev === side ? prev : side));
			}
		},
		[setLeftPanel, setCentralPanel, setRightPanel, setFocusedPanel],
	);

	const handleAddView = useCallback(
		(side: PanelSide, viewKey: ViewKey) => {
			setPanelState(
				side,
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
			);
		},
		[setPanelState],
	);

	const focusPanel = useCallback((side: PanelSide) => {
		setFocusedPanel((prev) => (prev === side ? prev : side));
	}, []);

	const [activeId, setActiveId] = useState<string | null>(null);
	const hydratedLeft = leftPanel;
	const hydratedCentral = centralPanel;
	const hydratedRight = rightPanel;

	const pointerSensorOptions = useMemo(
		() => ({ activationConstraint: { distance: 8 } }),
		[],
	);
	const pointerSensor = useSensor(PointerSensor, pointerSensorOptions);
	const sensors = useSensors(pointerSensor);

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

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
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

			let movedView: ViewInstance | null = null;

			setPanelState(fromPanel, (panel) => {
				const view = panel.views.find(
					(entry) => entry.instanceKey === instanceKey,
				);
				if (!view) {
					return panel;
				}
				movedView = view;
				const remaining = panel.views.filter(
					(entry) => entry.instanceKey !== instanceKey,
				);
				const nextActive =
					panel.activeInstanceKey === instanceKey
						? (remaining[remaining.length - 1]?.instanceKey ?? null)
						: panel.activeInstanceKey;
				return { views: remaining, activeInstanceKey: nextActive };
			});

			if (!movedView) return;

			setPanelState(
				toPanel,
				(panel) => ({
					views: [...panel.views, movedView as ViewInstance],
					activeInstanceKey: (movedView as ViewInstance).instanceKey,
				}),
				{ focus: true },
			);
		},
		[setPanelState],
	);

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

	const handleOpenFile = useCallback(
		(
			filePath: string,
			options?: {
				readonly focus?: boolean;
			},
		) => {
			const shouldFocus = options?.focus ?? true;
			setPanelState(
				"central",
				(panel) => {
					const existingFileView = panel.views.find(
						(view) => view.metadata?.filePath === filePath,
					);
					if (existingFileView) {
						return activatePanelView(panel, existingFileView.instanceKey);
					}
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
					return upsertPendingView(panel, newView);
				},
				{ focus: shouldFocus },
			);
		},
		[setPanelState],
	);

	const handleOpenCommit = useCallback(
		(
			checkpointId: string,
			label: string,
			options?: {
				readonly focus?: boolean;
			},
		) => {
			const shouldFocus = options?.focus ?? true;
			setPanelState(
				"central",
				(panel) => {
					const existingCommitView = panel.views.find(
						(view) => view.metadata?.checkpointId === checkpointId,
					);
					if (existingCommitView) {
						return activatePanelView(panel, existingCommitView.instanceKey);
					}
					const newView: ViewInstance = {
						instanceKey: createViewInstanceKey("commit"),
						viewKey: "commit" as ViewKey,
						isPending: true,
						metadata: {
							checkpointId,
							label,
						},
					};
					return upsertPendingView(panel, newView);
				},
				{ focus: shouldFocus },
			);
		},
		[setPanelState],
	);

	const handleOpenDiff = useCallback(
		(
			fileId: string,
			filePath: string,
			options?: {
				readonly focus?: boolean;
			},
		) => {
			const shouldFocus = options?.focus ?? true;
			setPanelState(
				"central",
				(panel) => {
					const diffLabel = diffLabelFromPath(filePath) ?? filePath;
					const diffConfig = createWorkingVsCheckpointDiffConfig(
						fileId,
						diffLabel,
					);
					const existingDiffView = panel.views.find(
						(view) =>
							view.viewKey === "diff" && view.metadata?.fileId === fileId,
					);
					if (existingDiffView) {
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
					return upsertPendingView(panel, newView);
				},
				{ focus: shouldFocus },
			);
		},
		[setPanelState],
	);

	const sharedViewContext = useMemo(
		() => ({
			onOpenFile: handleOpenFile,
			onOpenCommit: handleOpenCommit,
			onOpenDiff: handleOpenDiff,
		}),
		[handleOpenFile, handleOpenCommit, handleOpenDiff],
	);

	const isLeftFocused = focusedPanel === "left";
	const isCentralFocused = focusedPanel === "central";
	const isRightFocused = focusedPanel === "right";

	const addViewOnLeft = useCallback(
		(viewKey: ViewKey) => handleAddView("left", viewKey),
		[handleAddView],
	);

	const addViewOnRight = useCallback(
		(viewKey: ViewKey) => handleAddView("right", viewKey),
		[handleAddView],
	);

	const handleSelectLeftView = useCallback(
		(instanceKey: string) =>
			setPanelState(
				"left",
				(panel) => ({
					views: panel.views,
					activeInstanceKey: instanceKey,
				}),
				{ focus: true },
			),
		[setPanelState],
	);

	const handleSelectCentralView = useCallback(
		(instanceKey: string) =>
			setPanelState(
				"central",
				(panel) => activatePanelView(panel, instanceKey),
				{ focus: true },
			),
		[setPanelState],
	);

	const handleSelectRightView = useCallback(
		(instanceKey: string) =>
			setPanelState(
				"right",
				(panel) => ({
					views: panel.views,
					activeInstanceKey: instanceKey,
				}),
				{ focus: true },
			),
		[setPanelState],
	);

	const handleRemoveView = useCallback(
		(side: PanelSide, instanceKey: string) =>
			setPanelState(
				side,
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
			),
		[setPanelState],
	);

	const leftViewContext = useMemo(
		() => ({
			...sharedViewContext,
			isPanelFocused: isLeftFocused,
		}),
		[sharedViewContext, isLeftFocused],
	);

	const centralViewContext = useMemo(
		() => ({
			...sharedViewContext,
			isPanelFocused: isCentralFocused,
		}),
		[sharedViewContext, isCentralFocused],
	);

	const rightViewContext = useMemo(
		() => ({
			...sharedViewContext,
			isPanelFocused: isRightFocused,
		}),
		[sharedViewContext, isRightFocused],
	);

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
								panel={leftPanel}
								isFocused={focusedPanel === "left"}
								onFocusPanel={focusPanel}
								onSelectView={handleSelectLeftView}
								onAddView={addViewOnLeft}
								onRemoveView={(instanceKey) =>
									handleRemoveView("left", instanceKey)
								}
								viewContext={leftViewContext}
							/>
						</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel defaultSize={panelSizes.central} minSize={30}>
							<CentralPanel
								panel={centralPanel}
								isFocused={focusedPanel === "central"}
								onFocusPanel={focusPanel}
								onSelectView={handleSelectCentralView}
								onRemoveView={(instanceKey) =>
									handleRemoveView("central", instanceKey)
								}
								onFinalizePendingView={(instanceKey) =>
									setPanelState(
										"central",
										(panel) => activatePanelView(panel, instanceKey),
										{ focus: true },
									)
								}
								viewContext={centralViewContext}
							/>
						</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel defaultSize={panelSizes.right} minSize={10} maxSize={40}>
							<SidePanel
								side="right"
								title="Secondary"
								panel={rightPanel}
								isFocused={focusedPanel === "right"}
								onFocusPanel={focusPanel}
								onSelectView={handleSelectRightView}
								onAddView={addViewOnRight}
								onRemoveView={(instanceKey) =>
									handleRemoveView("right", instanceKey)
								}
								viewContext={rightViewContext}
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
