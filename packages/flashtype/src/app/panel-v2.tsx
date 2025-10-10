import clsx from "clsx";
import {
	forwardRef,
	useCallback,
	useLayoutEffect,
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
import { KeepPreviousSuspense } from "@/components/keep-previous-suspense";
import styles from "./panel.module.css";

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

	const activeView = activeEntry
		? (VIEW_MAP.get(activeEntry.viewKey) ?? null)
		: null;
	const hasViews = panel.views.length > 0;
	const activeInstanceKey = activeEntry?.instanceKey ?? null;

	const contextWithFocus: ViewContext | undefined = viewContext
		? viewContext.isPanelFocused === isFocused
			? viewContext
			: { ...viewContext, isPanelFocused: isFocused }
		: { isPanelFocused: isFocused };

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
								const view = VIEW_MAP.get(entry.viewKey);
								if (!view) return null;
								const isActive = activeInstanceKey === entry.instanceKey;
								const label = resolveLabel(view, entry, tabLabel);
								return (
									<SortableTab
										key={entry.instanceKey}
										instanceKey={entry.instanceKey}
										panelSide={side}
										viewKey={entry.viewKey}
										icon={view.icon}
										label={label}
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
						{activeView && activeEntry && (
							<KeepPreviousSuspense>
								<div className="flex min-h-0 flex-1 flex-col overflow-auto">
									{activeView.render(contextWithFocus, activeEntry)}
								</div>
							</KeepPreviousSuspense>
						)}
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
	readonly viewContext?: ViewContext;
	readonly tabLabel?: (view: ViewDefinition, instance: ViewInstance) => string;
	readonly extraTabBarContent?: ReactNode;
	readonly emptyStatePlaceholder?: ReactNode;
	readonly onActiveViewInteraction?: (instanceKey: string) => void;
	readonly dropId?: string;
};

const resolveLabel = (
	view: ViewDefinition,
	instance: ViewInstance,
	tabLabel?: PanelV2Props["tabLabel"],
): string => {
	if (tabLabel) {
		return tabLabel(view, instance);
	}
	return instance.metadata?.label ?? view.label;
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
	"group flex flex-none max-w-[20rem] items-center gap-0.5 rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";

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
				<Icon className="h-3.5 w-3.5" />
				<span
					className={clsx("max-w-[10rem] truncate", isPending && "italic")}
					title={label}
				>
					{label}
				</span>
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
			</button>
		);
	},
);

TabButtonBase.displayName = "PanelTabButton";

export type PanelTabPreviewProps = {
	readonly icon: LucideIcon;
	readonly label: string;
	readonly isActive: boolean;
	readonly isFocused: boolean;
	readonly isPending?: boolean;
};

export function PanelTabPreview(props: PanelTabPreviewProps) {
	return <TabButtonBase {...props} />;
}
