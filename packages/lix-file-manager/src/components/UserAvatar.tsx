import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar.js";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip.js";
import type { LixAccount } from "@lix-js/sdk";

interface UserAvatarProps {
	account: LixAccount | null;
	onClick?: () => void;
}

export function UserAvatar({ account, onClick }: UserAvatarProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Avatar
					className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity"
					onClick={onClick}
				>
					<AvatarImage src="#" alt="#" />
					<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
						{account?.name ? account.name.substring(0, 2).toUpperCase() : "XX"}
					</AvatarFallback>
				</Avatar>
			</TooltipTrigger>
			<TooltipContent side="right" sideOffset={20}>
				Settings
			</TooltipContent>
		</Tooltip>
	);
}
