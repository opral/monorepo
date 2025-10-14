import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from "react";
import {
	Panel,
	PanelGroup,
	PanelResizeHandle,
	type ImperativePanelHandle,
} from "react-resizable-panels";
import {
	DndContext,
	DragOverlay,
	type DragEndEvent,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useLix } from "@lix-js/react-utils";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import { nanoId, normalizeFilePath, selectWorkingDiff } from "@lix-js/sdk";
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
import { PanelTabPreview } from "./panel-v2";
import {
	FLASHTYPE_UI_STATE_KEY,
	normalizeLayoutSizes,
	type PanelLayoutSizes,
	type FlashtypeUiState,
} from "./ui-state";
import { activatePanelView, upsertPendingView } from "./pending-view";

const hydratePanel = (panel: PanelState): PanelState => {
	const views = panel.views
		// Drop unknown view keys that might linger in persisted UI state.
		.filter((view) => VIEW_MAP.has(view.viewKey))
		.map(upgradeDiffMetadata);
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

const fileLabelFromPath = (
	filePath?: string,
	fallbackLabel?: string,
): string => {
	const derived = diffLabelFromPath(filePath);
	if (derived) return derived;
	if (filePath) return filePath;
	return fallbackLabel ?? "Untitled";
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

const DEFAULT_PANEL_FALLBACK_SIZES = normalizeLayoutSizes();
const MIN_VISIBLE_PANEL_SIZE = 1;
const PANEL_TRANSITION_STYLE: CSSProperties = {
	transitionProperty: "flex-grow, flex-basis",
	transitionDuration: "200ms",
	transitionTimingFunction: "ease-in-out",
};

/**
 * Returns a shallow clone of a view instance stored in a panel, including a
 * copied metadata object to keep state transitions immutable when moving tabs
 * between panels.
 *
 * @example
 * const cloned = cloneViewInstanceByKey(panelState, "files-1");
 */
export function cloneViewInstanceByKey(
	panel: PanelState,
	instanceKey: string,
): ViewInstance | null {
	const view = panel.views.find((entry) => entry.instanceKey === instanceKey);
	if (!view) return null;
	return {
		...view,
		metadata: view.metadata ? { ...view.metadata } : undefined,
	};
}

export function reorderPanelViews(
	panel: PanelState,
	movingInstanceKey: string,
	targetInstanceKey: string,
): PanelState {
	if (movingInstanceKey === targetInstanceKey) {
		return panel;
	}
	const views = panel.views.slice();
	const fromIndex = views.findIndex(
		(entry) => entry.instanceKey === movingInstanceKey,
	);
	const targetIndex = views.findIndex(
		(entry) => entry.instanceKey === targetInstanceKey,
	);
	if (fromIndex === -1 || targetIndex === -1) {
		return panel;
	}
	const [moving] = views.splice(fromIndex, 1);
	const insertionIndex =
		fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
	views.splice(insertionIndex, 0, moving);
	return {
		views,
		activeInstanceKey:
			panel.activeInstanceKey === moving.instanceKey
				? moving.instanceKey
				: panel.activeInstanceKey,
	};
}

export function reorderPanelViewsByIndex(
	panel: PanelState,
	fromIndex: number,
	toIndex: number,
): PanelState {
	if (fromIndex === toIndex) return panel;
	const views = panel.views.slice();
	if (
		fromIndex < 0 ||
		fromIndex >= views.length ||
		toIndex < 0 ||
		toIndex > views.length
	) {
		return panel;
	}
	const [moving] = views.splice(fromIndex, 1);
	const target = toIndex > views.length ? views.length : toIndex;
	views.splice(target, 0, moving);
	return {
		views,
		activeInstanceKey: panel.activeInstanceKey,
	};
}

/**
 * Generates a unique root-level markdown path for a newly created document.
 *
 * Uses a stable `new-file.md` naming scheme and appends numeric suffixes when
 * conflicts are detected (e.g. `/new-file-2.md`). Falls back to a timestamped
 * suffix if a unique path cannot be found within a reasonable range.
 *
 * @example
 * const nextPath = deriveUntitledMarkdownPath(new Set(["/new-file.md"]));
 * console.log(nextPath); // "/new-file-2.md"
 */
function deriveUntitledMarkdownPath(existingPaths: Set<string>): string {
	const baseStem = "new-file";
	const primary = normalizeFilePath(`/${baseStem}.md`);
	if (!existingPaths.has(primary)) {
		return primary;
	}
	for (let suffix = 2; suffix < 1000; suffix += 1) {
		const candidate = normalizeFilePath(`/${baseStem}-${suffix}.md`);
		if (!existingPaths.has(candidate)) {
			return candidate;
		}
	}
	return normalizeFilePath(`/${baseStem}-${Date.now()}.md`);
}

/**
 * App layout shell with independent left and right islands.
 *
 * @example
 * <V2LayoutShell />
 */
export function V2LayoutShell() {
	const [uiStateKV, setUiStateKV] = useKeyValue(FLASHTYPE_UI_STATE_KEY);
	const lix = useLix();
	if (!uiStateKV) {
		throw new Error("Flashtype UI state is unavailable.");
	}

	const initialLayoutSizes = normalizeLayoutSizes(uiStateKV.layout?.sizes);

	const [leftPanel, setLeftPanel] = useState<PanelState>(() =>
		hydratePanel(uiStateKV.panels.left),
	);
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
	const [isLeftCollapsed, setIsLeftCollapsed] = useState(
		() => initialLayoutSizes.left <= MIN_VISIBLE_PANEL_SIZE,
	);
	const [isRightCollapsed, setIsRightCollapsed] = useState(
		() => initialLayoutSizes.right <= MIN_VISIBLE_PANEL_SIZE,
	);
	const [shouldAnimatePanels, setShouldAnimatePanels] = useState(false);
	const animationTimeoutRef = useRef<number | null>(null);
	const lastNonZeroSizesRef = useRef({
		left:
			initialLayoutSizes.left > MIN_VISIBLE_PANEL_SIZE
				? initialLayoutSizes.left
				: DEFAULT_PANEL_FALLBACK_SIZES.left,
		right:
			initialLayoutSizes.right > MIN_VISIBLE_PANEL_SIZE
				? initialLayoutSizes.right
				: DEFAULT_PANEL_FALLBACK_SIZES.right,
	});
	const leftPanelRef = useRef<ImperativePanelHandle | null>(null);
	const rightPanelRef = useRef<ImperativePanelHandle | null>(null);

	const lastPersistedRef = useRef<string>(
		JSON.stringify({
			focusedPanel: uiStateKV.focusedPanel,
			panels: uiStateKV.panels,
			layout: { sizes: initialLayoutSizes },
		} satisfies FlashtypeUiState),
	);
	const pendingPersistRef = useRef<string | null>(null);
	const hydratingRef = useRef(false);

	const updateDerivedPanelState = useCallback(
		(next: PanelLayoutSizes) => {
			if (next.left > MIN_VISIBLE_PANEL_SIZE) {
				lastNonZeroSizesRef.current.left = next.left;
			}
			if (next.right > MIN_VISIBLE_PANEL_SIZE) {
				lastNonZeroSizesRef.current.right = next.right;
			}
			setIsLeftCollapsed(next.left <= MIN_VISIBLE_PANEL_SIZE);
			setIsRightCollapsed(next.right <= MIN_VISIBLE_PANEL_SIZE);
		},
		[setIsLeftCollapsed, setIsRightCollapsed],
	);

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
			updateDerivedPanelState(next);
			return next;
		});
		queueMicrotask(() => {
			hydratingRef.current = false;
			if (pendingPersistRef.current === serialized) {
				pendingPersistRef.current = null;
			}
		});
	}, [uiStateKV, updateDerivedPanelState]);

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

	const handleLayoutChange = useCallback(
		(sizes: number[]) => {
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
				updateDerivedPanelState(next);
				return next;
			});
		},
		[updateDerivedPanelState],
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setActiveId(null);
			const { active, over } = event;

			if (!over) return;

			const dragData = active.data.current as
				| { instanceKey: string; viewKey: ViewKey; fromPanel: PanelSide }
				| undefined;
			const dropData = over.data.current as
				| {
						panel?: PanelSide;
						instanceKey?: string;
						sortable?: { index: number };
				  }
				| undefined;
			const overSortable = (over.data.current as any)?.sortable as
				| { index: number }
				| undefined;

			if (!dragData || !dropData) return;

			const { instanceKey, viewKey: _viewKey, fromPanel } = dragData;
			const toPanel = dropData.panel ?? fromPanel;
			const targetInstanceKey = dropData.instanceKey;

			if (toPanel === fromPanel) {
				setPanelState(
					fromPanel,
					(panel) => {
						const fromIndex = panel.views.findIndex(
							(entry) => entry.instanceKey === instanceKey,
						);
						if (fromIndex === -1) return panel;
						let toIndex: number | null = null;
						if (overSortable?.index != null) {
							toIndex = overSortable.index;
						} else if (targetInstanceKey) {
							toIndex = panel.views.findIndex(
								(entry) => entry.instanceKey === targetInstanceKey,
							);
						} else {
							toIndex = panel.views.length - 1;
						}
						if (toIndex == null || toIndex === -1) {
							return panel;
						}
						return reorderPanelViewsByIndex(panel, fromIndex, toIndex);
					},
					{ focus: true },
				);
				return;
			}

			const sourcePanel =
				fromPanel === "left"
					? leftPanel
					: fromPanel === "central"
						? centralPanel
						: rightPanel;
			const movedView = cloneViewInstanceByKey(sourcePanel, instanceKey);

			if (!movedView) return;

			setPanelState(fromPanel, (panel) => {
				const remaining = panel.views.filter(
					(entry) => entry.instanceKey !== instanceKey,
				);
				const nextActive =
					panel.activeInstanceKey === instanceKey
						? (remaining[remaining.length - 1]?.instanceKey ?? null)
						: panel.activeInstanceKey;
				return { views: remaining, activeInstanceKey: nextActive };
			});

			setPanelState(
				toPanel,
				(panel) => {
					const views = [...panel.views];
					let insertIndex = views.length;
					if (overSortable?.index != null) {
						insertIndex = Math.min(overSortable.index, views.length);
					} else if (targetInstanceKey) {
						const targetIndex = views.findIndex(
							(entry) => entry.instanceKey === targetInstanceKey,
						);
						if (targetIndex !== -1) {
							insertIndex = targetIndex;
						}
					}
					views.splice(insertIndex, 0, movedView);
					return {
						views,
						activeInstanceKey: movedView.instanceKey,
					};
				},
				{ focus: true },
			);
		},
		[centralPanel, leftPanel, rightPanel, setPanelState],
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
			fileId: string,
			options?: {
				readonly focus?: boolean;
				readonly filePath?: string;
			},
		) => {
			const shouldFocus = options?.focus ?? true;
			const filePath = options?.filePath;
			setPanelState(
				"central",
				(panel) => {
					const existingFileView = panel.views.find(
						(view) =>
							view.metadata?.fileId === fileId ||
							(filePath && view.metadata?.filePath === filePath),
					);
					if (existingFileView) {
						const activated = activatePanelView(
							panel,
							existingFileView.instanceKey,
						);
						const nextViews = activated.views.map((entry) => {
							if (entry.instanceKey !== existingFileView.instanceKey) {
								return entry;
							}
							const nextMetadata = {
								...entry.metadata,
								fileId,
								filePath: filePath ?? entry.metadata?.filePath,
							};
							if (!nextMetadata.label) {
								nextMetadata.label = fileLabelFromPath(
									nextMetadata.filePath,
									fileId,
								);
							}
							return {
								...entry,
								metadata: nextMetadata,
							};
						});
						return {
							views: nextViews,
							activeInstanceKey: activated.activeInstanceKey,
						};
					}
					const label = fileLabelFromPath(filePath, fileId);
					const newView: ViewInstance = {
						instanceKey: createViewInstanceKey("file-content"),
						viewKey: "file-content" as ViewKey,
						isPending: true,
						metadata: filePath
							? {
									fileId,
									filePath,
									label,
								}
							: {
									fileId,
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

	const handleCreateNewFile = useCallback(async () => {
		if (!lix) return;
		const rows = await lix.db.selectFrom("file").select("path").execute();
		const existingPaths = new Set(
			rows.map((row) => normalizeFilePath(row.path)),
		);
		const path = deriveUntitledMarkdownPath(existingPaths);
		const id = await nanoId({ lix });
		await lix.db
			.insertInto("file")
			.values({
				id,
				path,
				data: new TextEncoder().encode(""),
			})
			.execute();
		handleOpenFile(id, { focus: true, filePath: path });
	}, [handleOpenFile, lix]);

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
			setTabBadgeCount: () => {},
			lix,
		}),
		[handleOpenFile, handleOpenCommit, handleOpenDiff, lix],
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

	const schedulePanelAnimation = useCallback(() => {
		setShouldAnimatePanels(true);
		if (animationTimeoutRef.current !== null) {
			window.clearTimeout(animationTimeoutRef.current);
		}
		animationTimeoutRef.current = window.setTimeout(() => {
			setShouldAnimatePanels(false);
			animationTimeoutRef.current = null;
		}, 220);
	}, []);

	useEffect(() => {
		return () => {
			if (animationTimeoutRef.current !== null) {
				window.clearTimeout(animationTimeoutRef.current);
			}
		};
	}, []);

	const toggleLeftSidebar = useCallback(() => {
		const panel = leftPanelRef.current;
		if (!panel) return;
		if (isLeftCollapsed) {
			const desiredSize =
				lastNonZeroSizesRef.current.left > MIN_VISIBLE_PANEL_SIZE
					? lastNonZeroSizesRef.current.left
					: initialLayoutSizes.left;
			const target =
				desiredSize > MIN_VISIBLE_PANEL_SIZE
					? desiredSize
					: DEFAULT_PANEL_FALLBACK_SIZES.left;
			setIsLeftCollapsed(false);
			schedulePanelAnimation();
			panel.resize(target);
		} else {
			setIsLeftCollapsed(true);
			schedulePanelAnimation();
			panel.resize(0);
		}
	}, [isLeftCollapsed, initialLayoutSizes.left, schedulePanelAnimation]);

	const toggleRightSidebar = useCallback(() => {
		const panel = rightPanelRef.current;
		if (!panel) return;
		if (isRightCollapsed) {
			const desiredSize =
				lastNonZeroSizesRef.current.right > MIN_VISIBLE_PANEL_SIZE
					? lastNonZeroSizesRef.current.right
					: initialLayoutSizes.right;
			const target =
				desiredSize > MIN_VISIBLE_PANEL_SIZE
					? desiredSize
					: DEFAULT_PANEL_FALLBACK_SIZES.right;
			setIsRightCollapsed(false);
			schedulePanelAnimation();
			panel.resize(target);
		} else {
			setIsRightCollapsed(true);
			schedulePanelAnimation();
			panel.resize(0);
		}
	}, [isRightCollapsed, initialLayoutSizes.right, schedulePanelAnimation]);

	const animatedPanelClass = shouldAnimatePanels
		? "transition-[flex-basis] duration-200 ease-in-out"
		: undefined;
	const animatedPanelStyle = shouldAnimatePanels
		? PANEL_TRANSITION_STYLE
		: undefined;

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div
				className="relative flex flex-col bg-neutral-100 text-neutral-900"
				style={{
					// Pin the shell to the available viewport (inspector offset included) to avoid vertical scrolling.
					height: "calc(100dvh - var(--lix-inspector-offset, 0px))",
				}}
			>
				<TopBar
					onToggleLeftSidebar={toggleLeftSidebar}
					onToggleRightSidebar={toggleRightSidebar}
					isLeftSidebarVisible={!isLeftCollapsed}
					isRightSidebarVisible={!isRightCollapsed}
				/>
				<div className="flex flex-1 min-h-0 overflow-hidden px-2 gap-4">
					<PanelGroup direction="horizontal" onLayout={handleLayoutChange}>
						<Panel
							ref={leftPanelRef}
							defaultSize={panelSizes.left}
							minSize={10}
							maxSize={40}
							collapsible
							collapsedSize={0}
							className={animatedPanelClass}
							style={animatedPanelStyle}
						>
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
						<Panel
							defaultSize={panelSizes.central}
							minSize={30}
							className={animatedPanelClass}
							style={animatedPanelStyle}
						>
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
								onCreateNewFile={handleCreateNewFile}
							/>
						</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel
							ref={rightPanelRef}
							defaultSize={panelSizes.right}
							minSize={10}
							maxSize={40}
							collapsible
							collapsedSize={0}
							className={animatedPanelClass}
							style={animatedPanelStyle}
						>
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
						<PanelTabPreview
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
