import React from "react";
import clsx from "clsx";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
	initials: string;
	size?: "sm" | "md" | "lg";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
	({ initials, size = "md", className, ...props }, ref) => {
		// Size classes
		const sizeClasses = {
			sm: "h-6 w-6 text-xs",
			md: "h-10 w-10 text-sm",
			lg: "h-14 w-14 text-base",
		};

		return (
			<div
				ref={ref}
				className={clsx(
					"flex shrink-0 rounded-full bg-gray-200 items-center justify-center font-medium text-gray-700",
					sizeClasses[size],
					className,
				)}
				{...props}
			>
				{initials}
			</div>
		);
	},
);

Avatar.displayName = "Avatar";

export { Avatar };
