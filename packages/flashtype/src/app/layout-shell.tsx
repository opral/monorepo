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
import { nanoId, normalizeFilePath } from "@lix-js/sdk";
import { SidePanel } from "./side-panel";
import { CentralPanel } from "./central-panel";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import {
	ViewHostRegistryProvider,
	useViewHostRegistry,
} from "./view-host-registry";
import type {
	PanelSide,
	PanelState,
	ViewInstance,
	ViewInstanceProps,
	ViewKind,
} from "./types";
import { createViewInstanceId, VIEW_MAP } from "./view-registry";
import { PanelTabPreview } from "./panel-v2";
import {
	AGENT_VIEW_KIND,
	buildFileViewProps,
	createWorkingVsCheckpointDiffConfig,
	decodeURIComponentSafe,
	DIFF_VIEW_KIND,
	diffLabelFromPath,
	fileViewInstance,
	FILE_VIEW_KIND,
} from "./view-instance-helpers";
import {
	FLASHTYPE_UI_STATE_KEY,
	normalizeLayoutSizes,
	type PanelLayoutSizes,
	type FlashtypeUiState,
} from "./ui-state";
import { activatePanelView } from "./pending-view";
import { cloneViewInstance, reorderPanelViewsByIndex } from "./panel-utils";

type LegacyViewInstance = ViewInstance & {
	readonly metadata?: ViewInstance["props"];
};

const adoptLegacyProps = (view: LegacyViewInstance): ViewInstance => {
	if (view.props || !view.metadata) return view;
	const { metadata, ...rest } = view;
	return {
		...rest,
		props: metadata,
	};
};

const hydratePanel = (panel: PanelState): PanelState => {
	const views = (panel.views as LegacyViewInstance[])
		.map(adoptLegacyProps)
		// Drop unknown view keys that might linger in persisted UI state.
		.filter((view) => VIEW_MAP.has(view.kind))
		.map(upgradeDiffProps);
	if (views.length === 0) {
		return { views, activeInstance: null };
	}
	const fallbackActive = views[0]?.instance ?? null;
	const hasDesiredActive = panel.activeInstance
		? views.some((view) => view.instance === panel.activeInstance)
		: false;
	return {
		views,
		activeInstance: hasDesiredActive ? panel.activeInstance : fallbackActive,
	};
};

const upgradeDiffProps = (view: ViewInstance): ViewInstance => {
	if (view.kind !== DIFF_VIEW_KIND) return view;
	const fileId = view.props?.fileId;
	if (!fileId) return view;
	const existing = view.props?.diff;
	const nextLabel =
		view.props?.label ??
		diffLabelFromPath(view.props?.filePath) ??
		"Unnamed diff";
	if (existing?.query && view.props?.label === nextLabel) {
		return view;
	}
	return {
		...view,
		props: {
			...view.props,
			label: nextLabel,
			diff: existing?.query
				? existing
				: createWorkingVsCheckpointDiffConfig(fileId, nextLabel),
		},
	};
};

const DEFAULT_PANEL_FALLBACK_SIZES = {
	left: 20,
	central: 60,
	right: 20,
};
const MIN_UNCOLLAPSED_RIGHT_SIZE = 35;
const MIN_VISIBLE_PANEL_SIZE = 1;
const PANEL_TRANSITION_STYLE: CSSProperties = {
	transitionProperty: "flex-grow, flex-basis",
	transitionDuration: "200ms",
	transitionTimingFunction: "ease-in-out",
};

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

export function V2LayoutShell() {
	return (
		<ViewHostRegistryProvider>
			<LayoutShellContent />
		</ViewHostRegistryProvider>
	);
}

/**
 * App layout shell with independent left and right islands.
 *
 * @example
 * <V2LayoutShell />
 */
function LayoutShellContent() {
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
	const viewHostRegistry = useViewHostRegistry();

	const activeInstances = useMemo(() => {
		const keys = new Set<string>();
		for (const view of leftPanel.views) keys.add(view.instance);
		for (const view of centralPanel.views) keys.add(view.instance);
		for (const view of rightPanel.views) keys.add(view.instance);
		return keys;
	}, [leftPanel.views, centralPanel.views, rightPanel.views]);

	useEffect(() => {
		viewHostRegistry.pruneHosts(activeInstances);
	}, [viewHostRegistry, activeInstances]);

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

	const ensurePanelExpanded = useCallback(
		(side: PanelSide) => {
			if (side === "central") return;
			const panelRef =
				side === "left" ? leftPanelRef.current : rightPanelRef.current;
			const isCollapsed = side === "left" ? isLeftCollapsed : isRightCollapsed;
			if (!panelRef || !isCollapsed) return;
			const initialSize =
				side === "left" ? initialLayoutSizes.left : initialLayoutSizes.right;
			const lastSize =
				side === "left"
					? lastNonZeroSizesRef.current.left
					: lastNonZeroSizesRef.current.right;
			const fallbackSize =
				side === "left"
					? DEFAULT_PANEL_FALLBACK_SIZES.left
					: DEFAULT_PANEL_FALLBACK_SIZES.right;
			const desiredSize =
				lastSize > MIN_VISIBLE_PANEL_SIZE ? lastSize : initialSize;
			let targetSize =
				desiredSize > MIN_VISIBLE_PANEL_SIZE ? desiredSize : fallbackSize;
			if (side === "right") {
				targetSize = Math.max(targetSize, MIN_UNCOLLAPSED_RIGHT_SIZE);
			}
			schedulePanelAnimation();
			if (side === "left") {
				setIsLeftCollapsed(false);
			} else {
				setIsRightCollapsed(false);
			}
			panelRef.resize(targetSize);
		},
		[
			initialLayoutSizes.left,
			initialLayoutSizes.right,
			isLeftCollapsed,
			isRightCollapsed,
			schedulePanelAnimation,
		],
	);

	const handleOpenView = useCallback(
		({
			panel,
			kind,
			props,
			focus = true,
			instance,
		}: {
			panel: PanelSide;
			kind: ViewKind;
			props?: ViewInstanceProps;
			focus?: boolean;
			instance?: string;
		}) => {
			ensurePanelExpanded(panel);
			setPanelState(
				panel,
				(current) => {
					if (!instance) {
						const existing = current.views.find((entry) => entry.kind === kind);
						if (existing) {
							const views = props
								? current.views.map((entry) =>
										entry.instance === existing.instance
											? { ...entry, props }
											: entry,
									)
								: current.views;
							return {
								views,
								activeInstance: existing.instance,
							};
						}
					}
					const targetInstance = instance ?? createViewInstanceId(kind);
					const existingByInstance = instance
						? current.views.find((entry) => entry.instance === instance)
						: null;
					if (existingByInstance) {
						const views = current.views.map((entry) =>
							entry.instance === targetInstance
								? { ...entry, kind, props }
								: entry,
						);
						return {
							views,
							activeInstance: targetInstance,
						};
					}
					const nextView: ViewInstance = {
						instance: targetInstance,
						kind,
						props,
					};
					return {
						views: [...current.views, nextView],
						activeInstance: nextView.instance,
					};
				},
				{ focus },
			);
		},
		[ensurePanelExpanded, setPanelState],
	);

	const handleCloseView = useCallback(
		({
			panel,
			instance,
			kind,
		}: {
			panel?: PanelSide;
			instance?: string;
			kind?: ViewKind;
		}) => {
			if (!instance && !kind) return;
			const predicate = (entry: ViewInstance) => {
				if (instance) return entry.instance === instance;
				if (kind) return entry.kind === kind;
				return false;
			};
			const targetPanels: PanelSide[] = panel
				? [panel]
				: (["central", "left", "right"] as PanelSide[]);
			for (const side of targetPanels) {
				let removed = false;
				setPanelState(side, (current) => {
					const index = current.views.findIndex(predicate);
					if (index === -1) return current;
					removed = true;
					const views = current.views.filter((_, idx) => idx !== index);
					const removedView = current.views[index];
					const activeInstance =
						current.activeInstance === removedView.instance
							? (views[views.length - 1]?.instance ?? null)
							: current.activeInstance;
					return { views, activeInstance };
				});
				if (removed) break;
			}
		},
		[setPanelState],
	);

	const handleAddView = useCallback(
		(side: PanelSide, kind: ViewKind) => {
			handleOpenView({ panel: side, kind });
		},
		[handleOpenView],
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
				| { instance: string; kind: ViewKind; fromPanel: PanelSide }
				| undefined;
			const dropData = over.data.current as
				| {
						panel?: PanelSide;
						instance?: string;
						sortable?: { index: number };
				  }
				| undefined;
			const overSortable = (over.data.current as any)?.sortable as
				| { index: number }
				| undefined;

			if (!dragData || !dropData) return;

			const { instance, kind: _kind, fromPanel } = dragData;
			const toPanel = dropData.panel ?? fromPanel;
			const targetInstance = dropData.instance;

			if (toPanel === fromPanel) {
				setPanelState(
					fromPanel,
					(panel) => {
						const fromIndex = panel.views.findIndex(
							(entry) => entry.instance === instance,
						);
						if (fromIndex === -1) return panel;
						let toIndex: number | null = null;
						if (overSortable?.index != null) {
							toIndex = overSortable.index;
						} else if (targetInstance) {
							toIndex = panel.views.findIndex(
								(entry) => entry.instance === targetInstance,
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
			const movedView = cloneViewInstance(sourcePanel, instance);

			if (!movedView) return;

			setPanelState(fromPanel, (panel) => {
				const remaining = panel.views.filter(
					(entry) => entry.instance !== instance,
				);
				const nextActive =
					panel.activeInstance === instance
						? (remaining[remaining.length - 1]?.instance ?? null)
						: panel.activeInstance;
				return { views: remaining, activeInstance: nextActive };
			});

			setPanelState(
				toPanel,
				(panel) => {
					const views = [...panel.views];
					let insertIndex = views.length;
					if (overSortable?.index != null) {
						insertIndex = Math.min(overSortable.index, views.length);
					} else if (targetInstance) {
						const targetIndex = views.findIndex(
							(entry) => entry.instance === targetInstance,
						);
						if (targetIndex !== -1) {
							insertIndex = targetIndex;
						}
					}
					views.splice(insertIndex, 0, movedView);
					return {
						views,
						activeInstance: movedView.instance,
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
			].find((view) => view.instance === activeId)
		: null;
	const activeDragView = activeDragData
		? VIEW_MAP.get(activeDragData.kind)
		: null;

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
		handleOpenView({
			panel: "central",
			kind: FILE_VIEW_KIND,
			instance: fileViewInstance(id),
			props: buildFileViewProps({ fileId: id, filePath: path }),
			focus: true,
		});
	}, [handleOpenView, lix]);

	const activeCentralEntry = useMemo(() => {
		const activeInstance =
			centralPanel.activeInstance ?? centralPanel.views[0]?.instance ?? null;
		if (!activeInstance) return null;
		return (
			centralPanel.views.find((entry) => entry.instance === activeInstance) ??
			null
		);
	}, [centralPanel]);

	const activeStatusLabel = useMemo(() => {
		if (!activeCentralEntry) return null;
		const rawPath = activeCentralEntry.props?.filePath;
		if (rawPath) {
			const parts = rawPath.split("/").map((segment, index) => {
				if (index === 0 && segment === "") return "";
				return decodeURIComponentSafe(segment);
			});
			const decoded = parts.join("/");
			return decoded.length > 0 ? decoded : rawPath;
		}
		return (
			activeCentralEntry.props?.label ??
			VIEW_MAP.get(activeCentralEntry.kind)?.label ??
			null
		);
	}, [activeCentralEntry]);

	const isLeftFocused = focusedPanel === "left";
	const isCentralFocused = focusedPanel === "central";
	const isRightFocused = focusedPanel === "right";

	const addViewOnLeft = useCallback(
		(type: ViewKind) => handleAddView("left", type),
		[handleAddView],
	);

	const addViewOnRight = useCallback(
		(type: ViewKind) => handleAddView("right", type),
		[handleAddView],
	);

	const handleSelectLeftView = useCallback(
		(key: string) =>
			setPanelState(
				"left",
				(panel) => ({
					views: panel.views,
					activeInstance: key,
				}),
				{ focus: true },
			),
		[setPanelState],
	);

	const handleSelectCentralView = useCallback(
		(key: string) =>
			setPanelState("central", (panel) => activatePanelView(panel, key), {
				focus: true,
			}),
		[setPanelState],
	);

	const handleSelectRightView = useCallback(
		(key: string) =>
			setPanelState(
				"right",
				(panel) => ({
					views: panel.views,
					activeInstance: key,
				}),
				{ focus: true },
			),
		[setPanelState],
	);

	const handleRemoveView = useCallback(
		(side: PanelSide, instance: string) =>
			setPanelState(
				side,
				(panel) => {
					const targetView = panel.views.find(
						(entry) => entry.instance === instance,
					);
					if (!targetView) {
						return panel;
					}
					let views = panel.views.filter(
						(entry) => entry.instance !== instance,
					);
					if (
						side === "central" &&
						targetView.kind === DIFF_VIEW_KIND &&
						views.length === 0
					) {
						const fileId = targetView.props?.fileId
							? String(targetView.props.fileId)
							: null;
						if (fileId) {
							const filePath =
								typeof targetView.props?.filePath === "string"
									? targetView.props.filePath
									: undefined;
							const fallbackView: ViewInstance = {
								instance: fileViewInstance(fileId),
								kind: FILE_VIEW_KIND,
								isPending: true,
								props: buildFileViewProps({ fileId, filePath }),
							};
							views = [fallbackView];
							return {
								views,
								activeInstance: fallbackView.instance,
							};
						}
					}
					const nextActive =
						panel.activeInstance === instance
							? (views[views.length - 1]?.instance ?? null)
							: panel.activeInstance;
					return { views, activeInstance: nextActive };
				},
				{ focus: true },
			),
		[setPanelState],
	);

	const handleMoveViewToPanel = useCallback(
		(targetPanel: PanelSide, instance?: string) => {
			// Find the view in any panel
			const allViews = [
				...leftPanel.views.map((v) => ({
					...v,
					sourcePanel: "left" as PanelSide,
				})),
				...centralPanel.views.map((v) => ({
					...v,
					sourcePanel: "central" as PanelSide,
				})),
				...rightPanel.views.map((v) => ({
					...v,
					sourcePanel: "right" as PanelSide,
				})),
			];

			const viewToMove = instance
				? allViews.find((v) => v.instance === instance)
				: allViews.find((v) => v.kind === AGENT_VIEW_KIND);

			if (!viewToMove) return;

			const sourcePanel = viewToMove.sourcePanel;
			if (sourcePanel === targetPanel) return;

			// Remove from source panel
			setPanelState(sourcePanel, (panel) => {
				const views = panel.views.filter(
					(v) => v.instance !== viewToMove.instance,
				);
				const nextActive =
					panel.activeInstance === viewToMove.instance
						? (views[views.length - 1]?.instance ?? null)
						: panel.activeInstance;
				return { views, activeInstance: nextActive };
			});

			// Add to target panel
			setPanelState(
				targetPanel,
				(panel) => ({
					views: [
						...panel.views,
						{
							instance: viewToMove.instance,
							kind: viewToMove.kind,
							props: viewToMove.props,
						},
					],
					activeInstance: viewToMove.instance,
				}),
				{ focus: true },
			);
		},
		[leftPanel, centralPanel, rightPanel, setPanelState],
	);

	const handleResizePanel = useCallback(
		(side: PanelSide, size: number) => {
			const panel =
				side === "left" ? leftPanelRef.current : rightPanelRef.current;
			if (!panel) return;

			const clampedSize = Math.max(10, Math.min(40, size));
			setPanelSizes((prev) => ({
				...prev,
				[side]: clampedSize,
			}));

			if (side === "left") {
				setIsLeftCollapsed(clampedSize <= MIN_VISIBLE_PANEL_SIZE);
			} else {
				setIsRightCollapsed(clampedSize <= MIN_VISIBLE_PANEL_SIZE);
			}

			schedulePanelAnimation();
			panel.resize(clampedSize);
		},
		[schedulePanelAnimation],
	);

	const sharedViewContext = useMemo(
		() => ({
			openView: handleOpenView,
			closeView: handleCloseView,
			setTabBadgeCount: () => {},
			moveViewToPanel: handleMoveViewToPanel,
			resizePanel: handleResizePanel,
			focusPanel: focusPanel,
			lix,
		}),
		[
			handleOpenView,
			handleCloseView,
			handleMoveViewToPanel,
			handleResizePanel,
			focusPanel,
			lix,
		],
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
			let target =
				desiredSize > MIN_VISIBLE_PANEL_SIZE
					? desiredSize
					: DEFAULT_PANEL_FALLBACK_SIZES.right;
			target = Math.max(target, MIN_UNCOLLAPSED_RIGHT_SIZE);
			setIsRightCollapsed(false);
			schedulePanelAnimation();
			panel.resize(target);
		} else {
			setIsRightCollapsed(true);
			schedulePanelAnimation();
			panel.resize(0);
		}
	}, [isRightCollapsed, initialLayoutSizes.right, schedulePanelAnimation]);

	const isMacPlatform = useMemo(() => {
		if (typeof navigator === "undefined") return false;
		const platformCandidates = [
			((navigator as any).userAgentData?.platform as string | undefined) ??
				null,
			navigator.platform ?? null,
			navigator.userAgent ?? null,
		].filter(Boolean) as string[];
		const combined = platformCandidates.join(" ").toLowerCase();
		return /mac|iphone|ipad|ipod/.test(combined);
	}, []);

	const isInteractiveTarget = useCallback(
		(target: EventTarget | null): boolean => {
			if (!target || !(target instanceof HTMLElement)) return false;
			const tagName = target.tagName.toLowerCase();
			const isInput =
				tagName === "input" ||
				tagName === "textarea" ||
				tagName === "select" ||
				target.isContentEditable;
			return isInput;
		},
		[],
	);

	useEffect(() => {
		const listener = (event: KeyboardEvent) => {
			const usesPrimaryModifier = isMacPlatform
				? event.metaKey && !event.ctrlKey
				: event.ctrlKey && !event.metaKey;
			if (!usesPrimaryModifier || event.altKey || event.shiftKey) return;

			// CMD+1 for left panel
			if (event.key === "1" || event.code === "Digit1") {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation?.();
				event.returnValue = false;
				if (
					event.type === "keydown" &&
					!event.repeat &&
					!isInteractiveTarget(event.target)
				) {
					toggleLeftSidebar();
				}
				return;
			}

			// CMD+3 for right panel
			if (event.key === "3" || event.code === "Digit3") {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation?.();
				event.returnValue = false;
				if (
					event.type === "keydown" &&
					!event.repeat &&
					!isInteractiveTarget(event.target)
				) {
					toggleRightSidebar();
				}
				return;
			}
		};

		const options: AddEventListenerOptions = { capture: true, passive: false };
		const eventTypes: Array<"keydown" | "keypress" | "keyup"> = [
			"keydown",
			"keypress",
			"keyup",
		];
		const targets: EventTarget[] = [window, document];
		if (document.body) {
			targets.push(document.body);
		}
		for (const target of targets) {
			for (const type of eventTypes) {
				target.addEventListener(type, listener as EventListener, options);
			}
		}
		return () => {
			for (const target of targets) {
				for (const type of eventTypes) {
					target.removeEventListener(type, listener as EventListener, options);
				}
			}
		};
	}, [
		isMacPlatform,
		toggleLeftSidebar,
		toggleRightSidebar,
		isInteractiveTarget,
	]);

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
								onRemoveView={(key) => handleRemoveView("left", key)}
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
								onRemoveView={(key) => handleRemoveView("central", key)}
								onFinalizePendingView={(key) =>
									setPanelState(
										"central",
										(panel) => activatePanelView(panel, key),
										{ focus: true },
									)
								}
								viewContext={centralViewContext}
								onCreateNewFile={handleCreateNewFile}
								leftPanel={leftPanel}
								rightPanel={rightPanel}
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
								onRemoveView={(key) => handleRemoveView("right", key)}
								viewContext={rightViewContext}
							/>
						</Panel>
					</PanelGroup>
				</div>
				<StatusBar activePath={activeStatusLabel} />
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
