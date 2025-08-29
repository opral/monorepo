import * as React from "react";
import { FolderOpen, GitCommitVertical, Zap } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { FlashtypeMenu } from "@/components/flashtype-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { useLeftSidebar } from "@/components/left-sidebar";

// This is sample data.
const data = {
	user: {
		name: "flashtype",
		email: "local@flashtype.app",
		avatar: "/avatars/shadcn.jpg",
	},
	teams: [
		{
			name: "Flashtype",
			logo: Zap,
			plan: "Local",
		},
	],
	navMain: [
		{
			key: "files",
			title: "Files",
			icon: FolderOpen,
			isActive: true,
		},
		{
			key: "history",
			title: "Checkpoints",
			icon: GitCommitVertical,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { active, setActive } = useLeftSidebar();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="h-12.5">
				<FlashtypeMenu teams={data.teams} user={data.user} />
			</SidebarHeader>
			<SidebarContent className="mt-0">
				<NavMain
					items={data.navMain}
					active={active}
					onSelect={(key) => {
						const next =
							active === key
								? null
								: key === "files" || key === "history"
									? key
									: null;
						setActive(next);
					}}
				/>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
