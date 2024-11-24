import { cn } from "./../../lib/utils.ts";

interface ExpandButtonProps {
	isExpanded: boolean;
	onClick?: () => void;
	isHovered?: boolean;
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({
	isExpanded,
	onClick,
}) => (
	<button
		onClick={onClick}
		className="flex justify-center items-center w-9 h-9 relative gap-1 rounded-md"
	>
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("w-6 h-6 transition-transform", isExpanded && "rotate-180")}
		>
			<path
				d={isExpanded ? "M7 14L12 9L17 14H7Z" : "M17 14L12 9L7 14L17 14Z"}
				fill="#141A21"
			/>
		</svg>
	</button>
);
