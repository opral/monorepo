import clsx from "clsx";
import {
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useDraggable } from "@dnd-kit/core";
import { X, type LucideIcon } from "lucide-react";
import styles from "./panel.module.css";

interface PanelProps {
	readonly children: ReactNode;
	readonly className?: string;
}

/**
 * Base panel component with consistent styling for tab bars and content.
 * Used by both SidePanel and CentralPanel to ensure alignment.
 *
 * @example
 * <Panel>
 *   <Panel.TabBar>...</Panel.TabBar>
 *   <Panel.Content>...</Panel.Content>
 * </Panel>
 */
export function Panel({ children, className = "" }: PanelProps) {
	return (
		<div
			className={`flex min-h-0 flex-1 flex-col rounded-lg bg-neutral-0 ${className}`}
		>
			{children}
		</div>
	);
}

interface TabBarProps {
	readonly children: ReactNode;
	readonly className?: string;
}

Panel.TabBar = function TabBar({ children, className = "" }: TabBarProps) {
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
		<div className={clsx(styles.tabBar, className)}>
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
			</div>
		</div>
	);
};

interface ContentProps {
	readonly children: ReactNode;
	readonly className?: string;
}

Panel.Content = function Content({ children, className = "" }: ContentProps) {
	return (
		<div
			className={`flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 ${className}`}
		>
			{children}
		</div>
	);
};

interface TabProps {
	readonly icon: LucideIcon;
	readonly label: string;
	readonly isActive?: boolean;
	readonly isFocused?: boolean;
	readonly onClose?: () => void;
	readonly onClick?: () => void;
	readonly dragData?: {
		viewKey: string;
		viewId: string;
		fromPanel: string;
	};
}

const tabBaseClasses =
	"group flex flex-none max-w-[20rem] items-center gap-0.5 rounded-md border px-1 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";

const tabStateClasses = {
	focused: "bg-brand-200 text-neutral-900 border-brand-600",
	active: "bg-neutral-100 text-neutral-900 border-neutral-200",
	idle: "bg-transparent text-neutral-500 border-transparent hover:bg-neutral-100 hover:border-neutral-200 hover:text-neutral-900",
} as const;

Panel.Tab = function Tab({
	icon: Icon,
	label,
	isActive = false,
	isFocused = false,
	onClose,
	onClick,
	dragData,
}: TabProps) {
	const state = isActive ? (isFocused ? "focused" : "active") : "idle";

	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: dragData?.viewKey || `tab-${label}`,
		data: dragData,
		disabled: !dragData,
	});

	return (
		<button
			ref={setNodeRef}
			type="button"
			onClick={onClick}
			data-focused={isFocused ? "true" : undefined}
			className={clsx(
				tabBaseClasses,
				tabStateClasses[state],
				isDragging && "opacity-50 cursor-grabbing",
			)}
			{...attributes}
			{...listeners}
		>
			<Icon className="h-3.5 w-3.5" />
			<span className="max-w-[10rem] truncate" title={label}>
				{label}
			</span>
			{onClose && isActive && (
				<X
					className="h-3 w-3 text-neutral-400 hover:text-neutral-600"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
				/>
			)}
			{onClose && !isActive && (
				<X
					className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-600"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
				/>
			)}
		</button>
	);
};
