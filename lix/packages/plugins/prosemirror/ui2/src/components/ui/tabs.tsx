import clsx from "clsx";
import React, { createContext, useContext, useState } from "react";

// Create context for tabs
type TabsContextType = {
	value: string;
	onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error("Tabs components must be used within a Tabs provider");
	}
	return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
	defaultValue: string;
	value?: string;
	onValueChange?: (value: string) => void;
	className?: string;
}

const Tabs = ({
	defaultValue,
	value,
	onValueChange,
	children,
	className,
	...props
}: TabsProps) => {
	const [tabValue, setTabValue] = useState(value || defaultValue);

	const handleValueChange = (newValue: string) => {
		if (onValueChange) {
			onValueChange(newValue);
		} else {
			setTabValue(newValue);
		}
	};

	return (
		<TabsContext.Provider
			value={{
				value: value !== undefined ? value : tabValue,
				onValueChange: handleValueChange,
			}}
		>
			<div className={className} {...props}>
				{children}
			</div>
		</TabsContext.Provider>
	);
};

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={clsx(
					"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
					className,
				)}
				{...props}
			/>
		);
	},
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	value: string;
	className?: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
	({ className, value, ...props }, ref) => {
		const { value: selectedValue, onValueChange } = useTabs();
		const isSelected = selectedValue === value;

		return (
			<button
				ref={ref}
				type="button"
				role="tab"
				aria-selected={isSelected}
				data-state={isSelected ? "active" : "inactive"}
				onClick={() => onValueChange(value)}
				className={clsx(
					"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
					isSelected && "bg-background text-foreground shadow-sm",
					className,
				)}
				{...props}
			/>
		);
	},
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
	value: string;
	className?: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
	({ className, value, ...props }, ref) => {
		const { value: selectedValue } = useTabs();
		const isSelected = selectedValue === value;

		if (!isSelected) return null;

		return (
			<div
				ref={ref}
				role="tabpanel"
				data-state={isSelected ? "active" : "inactive"}
				className={clsx(
					"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					className,
				)}
				{...props}
			/>
		);
	},
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
