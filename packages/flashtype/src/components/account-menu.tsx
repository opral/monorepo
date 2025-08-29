import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from "lucide-react";
import {
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AccountMenuContent({
	user,
	isMobile,
	align = "end",
}: {
	user: { name: string; email: string; avatar: string };
	isMobile: boolean | undefined;
	align?: "start" | "center" | "end";
}) {
	return (
		<DropdownMenuContent
			className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
			side={isMobile ? "bottom" : "right"}
			align={align}
			sideOffset={4}
		>
			<DropdownMenuLabel className="p-0 font-normal">
				<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarImage src={user.avatar} alt={user.name} />
						<AvatarFallback className="rounded-lg">CN</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{user.name}</span>
						<span className="truncate text-xs">{user.email}</span>
					</div>
				</div>
			</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem>
					<Sparkles />
					Upgrade to Pro
				</DropdownMenuItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem>
					<BadgeCheck />
					Account
				</DropdownMenuItem>
				<DropdownMenuItem>
					<CreditCard />
					Billing
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Bell />
					Notifications
				</DropdownMenuItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuItem>
				<LogOut />
				Log out
			</DropdownMenuItem>
		</DropdownMenuContent>
	);
}
