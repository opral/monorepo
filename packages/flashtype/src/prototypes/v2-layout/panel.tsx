import { type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";

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
			className={`flex min-h-0 flex-1 flex-col rounded-lg bg-white ${className}`}
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
	return (
		<div className={`flex items-center gap-1 px-2 pt-2 ${className}`}>
			{children}
		</div>
	);
};

interface ContentProps {
	readonly children: ReactNode;
	readonly className?: string;
}

Panel.Content = function Content({ children, className = "" }: ContentProps) {
	return (
		<div className={`flex-1 overflow-auto px-2 pb-2 ${className}`}>
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
}

Panel.Tab = function Tab({
	icon: Icon,
	label,
	isActive = false,
	isFocused = false,
	onClose,
	onClick,
}: TabProps) {
	const baseClasses =
		"group flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors";

	const stateClasses =
		isActive && isFocused
			? "bg-brand-50 text-neutral-950 border-brand-primary"
			: isActive
				? "bg-neutral-100 text-neutral-950 border-neutral-300"
				: "bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:border-neutral-200";

	return (
		<button
			type="button"
			onClick={onClick}
			className={`${baseClasses} ${stateClasses}`}
		>
			<Icon className="h-3.5 w-3.5" />
			<span>{label}</span>
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
