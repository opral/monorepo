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
		<div className={`flex min-h-0 flex-1 flex-col rounded-lg bg-white ${className}`}>
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
	readonly onClose?: () => void;
	readonly onClick?: () => void;
	readonly variant?: "default" | "primary";
}

Panel.Tab = function Tab({
	icon: Icon,
	label,
	isActive = false,
	onClose,
	onClick,
	variant = "default",
}: TabProps) {
	const isPrimary = variant === "primary";

	const baseClasses = "group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors";
	const variantClasses = isPrimary
		? isActive
			? "bg-[#e3f2ff] text-[#3b82f6]"
			: "text-[#6f7586] hover:bg-[#f5f5f5]"
		: isActive
			? "bg-[#f0f0f0] font-semibold text-[#212430]"
			: "bg-transparent text-[#4d5361] hover:bg-[#f8f8f8]";

	return (
		<button
			type="button"
			onClick={onClick}
			className={`${baseClasses} ${variantClasses}`}
		>
			<Icon className="h-3.5 w-3.5" />
			<span>{label}</span>
			{onClose && isActive && (
				<X
					className="h-3 w-3 opacity-60 hover:opacity-100"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
				/>
			)}
			{onClose && !isActive && (
				<X
					className="h-3 w-3 opacity-0 group-hover:opacity-60 hover:opacity-100"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
				/>
			)}
		</button>
	);
};
