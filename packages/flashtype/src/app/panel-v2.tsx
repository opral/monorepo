import clsx from "clsx";
import {
	forwardRef,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type ButtonHTMLAttributes,
	type CSSProperties,
	type HTMLAttributes,
	type MouseEvent,
	type ReactNode,
} from "react";
import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, type LucideIcon } from "lucide-react";
import type {
	PanelSide,
	PanelState,
	ViewContext,
	ViewDefinition,
	ViewInstance,
	ViewKey,
} from "./types";
import { VIEW_MAP } from "./view-registry";
import styles from "./panel.module.css";
import { useViewContext } from "./view-context";
import {
	useViewHostRegistry,
	type ViewHostRecord,
} from "./view-host-registry";
import { Activity } from "react";

/**
 * Unified panel host that renders the shared tab strip and body layout for any side.
 *
 * Pass callbacks and slots for customizing tabs, interaction behavior, and empty
 * placeholders so parents only supply their unique behavior.
 *
 * @example
 * <PanelV2
 *   side="left"
 *   panel={panelState}
 *   onSelectView={selectView}
 *   onRemoveView={removeView}
 *   emptyStatePlaceholder={<EmptyState />}
 *   extraTabBarContent={<AddViewButton />}
 * />
 */
export function PanelV2({
	side,
	panel,
	isFocused,
	onFocusPanel,
	onSelectView,
	onRemoveView,
	viewContext,
	tabLabel,
	extraTabBarContent,
	emptyStatePlaceholder,
	onActiveViewInteraction,
	dropId,
	viewOverrides,
}: PanelV2Props) {
	const { setNodeRef, isOver } = useDroppable({
		id: dropId ?? `${side}-panel`,
		data: { panel: side },
	});

	const activeEntry = panel.activeInstanceKey
		? (panel.views.find(
				(entry) => entry.instanceKey === panel.activeInstanceKey,
			) ?? null)
		: (panel.views[0] ?? null);

	const resolveViewDefinition = useCallback(
		(viewKey: ViewKey): ViewDefinition | null => {
			const override = viewOverrides?.find(
				(candidate) => candidate.key === viewKey,
			);
			return override ?? VIEW_MAP.get(viewKey) ?? null;
		},
		[viewOverrides],
	);

	const hasViews = panel.views.length > 0;
	const activeInstanceKey = activeEntry?.instanceKey ?? null;
	const { badgeCounts, makeContext } = useViewContext({
		panel,
		isFocused,
		parentContext: viewContext,
	});

	const viewContexts = useMemo(() => {
		const map = new Map<string, ReturnType<typeof makeContext>>();
		for (const entry of panel.views) {
			map.set(entry.instanceKey, makeContext(entry));
		}
		return map;
	}, [panel.views, makeContext]);

	const activationCleanupRef = useRef<Map<string, (() => void) | undefined>>(
		new Map(),
	);

	useEffect(() => {
		const cleanupMap = activationCleanupRef.current;
		for (const entry of panel.views) {
			if (cleanupMap.has(entry.instanceKey)) continue;
			const view = resolveViewDefinition(entry.viewKey);
			if (!view?.activate) {
				cleanupMap.set(entry.instanceKey, undefined);
				continue;
			}
			const contextForView = viewContexts.get(entry.instanceKey);
			if (!contextForView) {
				cleanupMap.set(entry.instanceKey, undefined);
				continue;
			}
			const cleanup = view.activate({
				context: contextForView,
				instance: entry,
			});
			cleanupMap.set(entry.instanceKey, cleanup ?? undefined);
		}

		for (const [key, cleanup] of Array.from(cleanupMap.entries())) {
			if (!panel.views.some((entry) => entry.instanceKey === key)) {
				cleanup?.();
				cleanupMap.delete(key);
			}
		}
	}, [panel.views, resolveViewDefinition, viewContexts]);

	useEffect(() => {
		const cleanupMap = activationCleanupRef.current;
		return () => {
			cleanupMap.forEach((cleanup) => cleanup?.());
			cleanupMap.clear();
		};
	}, []);

	const handleInteraction = () => {
		if (!onActiveViewInteraction || !activeInstanceKey) return;
		onActiveViewInteraction(activeInstanceKey);
	};

	const ContainerElement =
		side === "central" ? ("section" as const) : ("aside" as const);
	const hostTextClass =
		side === "central" ? "text-neutral-900" : "text-neutral-600";
	const showTabBar = hasViews || Boolean(extraTabBarContent);

	const contentHandlers =
		onActiveViewInteraction && activeInstanceKey
			? {
					onPointerDownCapture: handleInteraction,
					onFocusCapture: handleInteraction,
				}
			: undefined;

	return (
		<ContainerElement
			ref={setNodeRef}
			onClickCapture={() => onFocusPanel(side)}
			className={clsx("flex h-full w-full flex-col", hostTextClass)}
		>
			<div
				className={clsx(
					"flex min-h-0 flex-1 flex-col rounded-lg bg-neutral-0",
					isOver && "ring-2 ring-brand-600 ring-inset",
				)}
			>
				{showTabBar ? (
					<TabBar extraContent={extraTabBarContent}>
						<SortableContext
							id={`panel-${side}`}
							items={panel.views.map((entry) => entry.instanceKey)}
							strategy={horizontalListSortingStrategy}
						>
							{panel.views.map((entry) => {
								const view = resolveViewDefinition(entry.viewKey);
								if (!view) return null;
								const isActive = activeInstanceKey === entry.instanceKey;
								const label = resolveLabel(view, entry, tabLabel);
								const badgeCount = badgeCounts[entry.instanceKey] ?? null;
								return (
									<SortableTab
										key={entry.instanceKey}
										instanceKey={entry.instanceKey}
										panelSide={side}
										viewKey={entry.viewKey}
										icon={view.icon}
										label={label}
										badgeCount={badgeCount}
										isActive={isActive}
										isFocused={isFocused && isActive}
										isPending={entry.isPending}
										onClick={() => onSelectView(entry.instanceKey)}
										onClose={() => onRemoveView(entry.instanceKey)}
									/>
								);
							})}
						</SortableContext>
					</TabBar>
				) : null}

				{hasViews ? (
					<PanelContent {...contentHandlers}>
						{panel.views.map((entry) => {
							const view = resolveViewDefinition(entry.viewKey);
							if (!view) return null;
							const context = viewContexts.get(entry.instanceKey);
							if (!context) return null;
							const isActive = activeInstanceKey === entry.instanceKey;
							return (
								<Activity
									key={entry.instanceKey}
									mode={isActive ? "visible" : "hidden"}
								>
									<ViewRenderer
										view={view}
										instance={entry}
										context={context}
									/>
								</Activity>
							);
						})}
					</PanelContent>
				) : (
					<PanelContent>{emptyStatePlaceholder}</PanelContent>
				)}
			</div>
		</ContainerElement>
	);
}

export type PanelV2Props = {
	readonly side: PanelSide;
	readonly panel: PanelState;
	readonly isFocused: boolean;
	readonly onFocusPanel: (side: PanelSide) => void;
	readonly onSelectView: (instanceKey: string) => void;
	readonly onRemoveView: (instanceKey: string) => void;
	readonly viewContext: ViewContext;
	readonly tabLabel?: (view: ViewDefinition, instance: ViewInstance) => string;
	readonly extraTabBarContent?: ReactNode;
	readonly emptyStatePlaceholder?: ReactNode;
	readonly onActiveViewInteraction?: (instanceKey: string) => void;
	readonly dropId?: string;
	readonly viewOverrides?: ViewDefinition[];
};

const resolveLabel = (
	view: ViewDefinition,
	instance: ViewInstance,
	tabLabel?: PanelV2Props["tabLabel"],
): string => {
	if (tabLabel) {
		return tabLabel(view, instance);
	}
	return instance.props?.label ?? view.label;
};

interface TabBarProps {
	readonly children: ReactNode;
	readonly extraContent?: ReactNode;
}

function TabBar({ children, extraContent }: TabBarProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const [thumb, setThumb] = useState({ width: "0%", left: "0%" });
	const [thumbVisible, setThumbVisible] = useState(false);
	const hideTimeoutRef = useRef<number | null>(null);

	const updateThumb = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const { scrollWidth, clientWidth, scrollLeft } = el;
		if (scrollWidth <= clientWidth) {
			setThumb({ width: "0%", left: "0%" });
			setThumbVisible(false);
			return;
		}
		const ratio = clientWidth / scrollWidth;
		const widthPercent = Math.max(ratio * 100, 10);
		const maxLeft = 100 - widthPercent;
		const leftPercent = Math.min(
			maxLeft,
			(scrollLeft / (scrollWidth - clientWidth)) * maxLeft,
		);
		setThumb({ width: `${widthPercent}%`, left: `${leftPercent}%` });
		setThumbVisible(true);
		if (hideTimeoutRef.current !== null) {
			window.clearTimeout(hideTimeoutRef.current);
		}
		hideTimeoutRef.current = window.setTimeout(
			() => setThumbVisible(false),
			250,
		);
	}, []);

	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		updateThumb();
		el.addEventListener("scroll", updateThumb);
		let resizeObserver: ResizeObserver | undefined;
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(updateThumb);
			resizeObserver.observe(el);
		}
		return () => {
			el.removeEventListener("scroll", updateThumb);
			resizeObserver?.disconnect();
			if (hideTimeoutRef.current !== null) {
				window.clearTimeout(hideTimeoutRef.current);
				hideTimeoutRef.current = null;
			}
		};
	}, [updateThumb]);

	return (
		<div className={styles.tabBar}>
			<div className={styles.indicatorTrack}>
				<div
					className={styles.indicatorThumb}
					style={{
						...thumb,
						opacity: thumbVisible ? 1 : 0,
						transition: "width 0.12s ease, left 0.12s ease, opacity 0.18s ease",
					}}
				/>
			</div>
			<div ref={scrollRef} className={styles.scrollContainer}>
				{children}
				{extraContent}
			</div>
		</div>
	);
}

interface PanelContentProps extends HTMLAttributes<HTMLDivElement> {
	readonly children: ReactNode;
}

function PanelContent({
	children,
	className = "",
	...rest
}: PanelContentProps) {
	return (
		<div
			className={clsx(
				"flex min-h-0 flex-1 flex-col overflow-hidden",
				className,
			)}
			{...rest}
		>
			{children}
		</div>
	);
}

function ViewRenderer({
	view,
	instance,
	context,
}: {
	view: ViewDefinition;
	instance: ViewInstance;
	context: ViewContext;
}) {
	const registry = useViewHostRegistry();
	const [host, setHost] = useState<ViewHostRecord | null>(null);

	useEffect(() => {
		const record = registry.ensureHost({ view, instance, context });
		setHost(record);
	}, [registry, view, instance, context]);

	return <ViewHostMount host={host} />;
}

function ViewHostMount({
	host,
}: {
	host: ViewHostRecord | null;
}) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		const mountPoint = containerRef.current;
		if (!mountPoint || !host) return;
		const node = host.container;
		mountPoint.appendChild(node);
		return () => {
			if (node.parentElement === mountPoint) {
				mountPoint.removeChild(node);
			}
		};
	}, [host]);

	return (
		<div
			ref={containerRef}
			className="flex min-h-0 flex-1 flex-col overflow-hidden"
		/>
	);
}

interface SortableTabProps extends PanelTabPreviewProps {
	readonly instanceKey: string;
	readonly panelSide: PanelSide;
	readonly viewKey: ViewKey;
	readonly onClick?: () => void;
	readonly onClose?: () => void;
	readonly isPending?: boolean;
}

function SortableTab({
	instanceKey,
	panelSide,
	viewKey,
	icon,
	label,
	badgeCount,
	isActive,
	isFocused,
	isPending,
	onClick,
	onClose,
}: SortableTabProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: instanceKey,
		data: {
			type: "panel-tab",
			panel: panelSide,
			instanceKey,
			viewKey,
			fromPanel: panelSide,
		},
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<TabButtonBase
			ref={setNodeRef}
			icon={icon}
			label={label}
			badgeCount={badgeCount}
			isActive={isActive}
			isFocused={isFocused}
			isPending={isPending}
			onClick={onClick}
			onClose={onClose}
			isDragging={isDragging}
			dataFocused={isFocused ? "true" : undefined}
			dataViewInstance={instanceKey}
			dataViewKey={viewKey}
			style={style}
			buttonProps={{
				...(attributes as ButtonHTMLAttributes<HTMLButtonElement>),
				...(listeners as ButtonHTMLAttributes<HTMLButtonElement>),
			}}
		/>
	);
}

const tabBaseClasses =
	"group relative flex flex-none max-w-[20rem] items-center gap-0.5 rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";

const tabStateClasses = {
	focused: "bg-brand-200 text-neutral-900 border-brand-600",
	active: "bg-neutral-100 text-neutral-900 border-neutral-200",
	idle: "bg-transparent text-neutral-500 border-transparent hover:bg-neutral-100 hover:border-neutral-200 hover:text-neutral-900",
} as const;

interface TabBaseProps extends PanelTabPreviewProps {
	readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	readonly onClose?: () => void;
	readonly isDragging?: boolean;
	readonly dataFocused?: string;
	readonly dataViewInstance?: string;
	readonly dataViewKey?: string;
	readonly buttonProps?: ButtonHTMLAttributes<HTMLButtonElement> | null;
	readonly style?: CSSProperties;
}

const TabButtonBase = forwardRef<HTMLButtonElement, TabBaseProps>(
	(
		{
			icon: Icon,
			label,
			badgeCount,
			isActive,
			isFocused,
			isPending,
			onClick,
			onClose,
			isDragging,
			dataFocused,
			dataViewInstance,
			dataViewKey,
			buttonProps = null,
			style,
		},
		ref,
	) => {
		const state = isActive ? (isFocused ? "focused" : "active") : "idle";
		const { onClick: dragOnClick, ...restButtonProps } = buttonProps ?? {};
		return (
			<button
				type="button"
				onClick={(event) => {
					dragOnClick?.(event);
					onClick?.(event);
				}}
				ref={ref}
				data-focused={dataFocused}
				data-view-instance={dataViewInstance}
				data-view-key={dataViewKey}
				className={clsx(
					tabBaseClasses,
					tabStateClasses[state],
					isDragging && "opacity-50 cursor-grabbing",
				)}
				style={style}
				{...restButtonProps}
			>
				<span className="relative flex h-3.5 w-3.5 items-center justify-center">
					<Icon className="h-3.5 w-3.5" />
					{badgeCount ? (
						<span
							className={clsx(
								"pointer-events-none absolute -top-1 -left-1 flex h-4 min-w-[16px] -translate-y-1/2 items-center justify-center rounded-full px-[3px] text-[0.65rem] font-semibold leading-none transform",
								isActive
									? "bg-brand-600 text-white"
									: "bg-secondary text-secondary-foreground",
							)}
						>
							{badgeCount > 99 ? "99+" : badgeCount}
						</span>
					) : null}
				</span>
				<span
					className={clsx("max-w-[10rem] truncate", isPending && "italic")}
					title={label}
				>
					{label}
				</span>
				<span className="relative ml-1 flex h-3.5 w-3.5 items-center justify-center">
					{onClose && isActive ? (
						<X
							className="h-3 w-3 text-neutral-400 hover:text-neutral-600"
							onClick={(event) => {
								event.stopPropagation();
								onClose();
							}}
						/>
					) : null}
					{onClose && !isActive ? (
						<X
							className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-600"
							onClick={(event) => {
								event.stopPropagation();
								onClose();
							}}
						/>
					) : null}
				</span>
			</button>
		);
	},
);

TabButtonBase.displayName = "PanelTabButton";

export type PanelTabPreviewProps = {
	readonly icon: LucideIcon;
	readonly label: string;
	readonly badgeCount?: number | null;
	readonly isActive: boolean;
	readonly isFocused: boolean;
	readonly isPending?: boolean;
};

export function PanelTabPreview(props: PanelTabPreviewProps) {
	return <TabButtonBase {...props} />;
}
