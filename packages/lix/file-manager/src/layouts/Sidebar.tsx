import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
} from "@/components/ui/sidebar.js";
import { TooltipProvider } from "@/components/ui/tooltip.js";
import { AccountDialog } from "@/components/AccountDialog.js";
import { SidebarNavigation } from "@/components/SidebarNavigation.js";
import { UserAvatar } from "@/components/UserAvatar.js";
import { useAtom } from "jotai";
import { activeAccountAtom } from "@/state.ts";
import { useState } from "react";

export function AppSidebar() {
	const [activeAccount] = useAtom(activeAccountAtom);
	const [accountDialogOpen, setAccountDialogOpen] = useState(false);

	return (
		<Sidebar
			className="w-14 h-full border-r border-[#DBDFE7] bg-[#FCFCFD]"
			collapsible="none"
		>
			<TooltipProvider>
				<SidebarHeader className="w-14 h-[60px] flex justify-center items-center">
					<img src="/lix.svg" alt="logo" className="w-6 h-6" />
				</SidebarHeader>

				<SidebarContent className="flex-1 pt-1.5">
					<SidebarNavigation />
				</SidebarContent>

				<SidebarFooter className="p-3 flex justify-center items-center">
					<UserAvatar
						account={activeAccount}
						onClick={() => setAccountDialogOpen(true)}
					/>
				</SidebarFooter>
			</TooltipProvider>

			<AccountDialog
				open={accountDialogOpen}
				onOpenChange={setAccountDialogOpen}
			/>
		</Sidebar>
	);
}
