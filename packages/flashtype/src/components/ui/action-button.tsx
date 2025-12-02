import type { ReactNode } from "react";
import { Button } from "./button";

type ActionButtonProps = {
	readonly icon: ReactNode;
	readonly label: string;
	readonly onClick: () => void;
	readonly ariaLabel?: string;
	readonly disabled?: boolean;
};

export function ActionButton({
	icon,
	label,
	onClick,
	ariaLabel,
	disabled = false,
}: ActionButtonProps) {
	return (
		<Button
			variant="outline"
			onClick={onClick}
			disabled={disabled}
			className="flex h-auto flex-col items-center justify-center gap-3 rounded-xl px-8 py-6"
			aria-label={ariaLabel}
		>
			{icon}
			<span>{label}</span>
		</Button>
	);
}
