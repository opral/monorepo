import * as React from "react";
import { Bug, Folders, GitCommitVertical, Github, LayoutDashboard, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { FlashtypeMenu } from "@/components/flashtype-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLeftSidebar } from "@/components/left-sidebar";

// This is sample data.
const data = {
	user: {
		name: "flashtype",
		email: "local@flashtype.app",
		avatar: null,
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
			// Use a consistent collection icon in the left rail
			icon: Folders,
			isActive: true,
		},
		{
			key: "history",
			title: "Checkpoints",
			icon: GitCommitVertical,
		},
		{
			key: "v2-layout",
			title: "V2 Layout",
			icon: LayoutDashboard,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { active, setActive } = useLeftSidebar();
	const navigate = useNavigate();

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
						if (key === "v2-layout") {
							void navigate({ to: "/v2-layout" });
							setActive(null);
							return;
						}
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
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip="Report a bug">
							<a
								href="https://github.com/opral/flashtype.ai/issues"
								target="_blank"
								rel="noopener noreferrer"
								className="cursor-pointer"
							>
								<Bug />
								<span>Report a bug</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip="Open on GitHub">
							<a
								href="https://github.com/opral/flashtype.ai"
								target="_blank"
								rel="noopener noreferrer"
								className="cursor-pointer"
							>
								<Github />
								<span>GitHub</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
