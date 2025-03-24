import clsx from "clsx";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "outline" | "ghost";
	size?: "sm" | "default" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = "default", size = "default", ...props }, ref) => {
		// Variant classes
		const variantClasses = {
			default: "bg-gray-200 hover:bg-gray-300",
			outline: "border border-gray-300 hover:bg-gray-100",
			ghost: "hover:bg-gray-100",
		};

		// Size classes
		const sizeClasses = {
			default: "h-10 px-4 py-2",
			sm: "h-9 px-3 py-1 text-sm",
			icon: "h-8 w-8 p-2",
		};

		const buttonClass = clsx(
			"inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
			variantClasses[variant],
			sizeClasses[size],
			className,
		);

		return <button className={buttonClass} ref={ref} {...props} />;
	},
);

Button.displayName = "Button";

export { Button };
