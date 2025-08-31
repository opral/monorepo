import * as React from "react";
import {
	ChevronsUpDown,
	Hammer,
	Search,
	FilePlus,
	RotateCcw,
} from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLix } from "@lix-js/react-utils";
import { initLixInspector, toggleLixInspector } from "@lix-js/inspector";
import { seedMarkdownFiles } from "@/seed";
import { OpfsStorage } from "@lix-js/sdk";

export function FlashtypeMenu({
	teams,
	user,
}: {
	teams: {
		name: string;
		logo: React.ElementType;
		plan: string;
	}[];
	user: { name: string; email: string; avatar: string };
}) {
	const { isMobile } = useSidebar();
	const lix = useLix();
	const [activeTeam] = React.useState(teams[0]);

	if (!activeTeam) {
		return null;
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg">
								<activeTeam.logo className="size-5 text-amber-500" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{activeTeam.name}</span>
								<span className="truncate text-xs">{activeTeam.plan}</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					{/* Flashtype app menu */}
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-2 font-normal">
							<div className="flex items-center gap-2 px-1 py-1 text-left text-sm">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg">
									<activeTeam.logo className="size-4 text-amber-500" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">flashtype</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<Hammer className="size-4 mr-2" />
								Developer tools
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="min-w-56">
								<DropdownMenuItem
									onSelect={async () => {
										try {
											const existing = document.getElementById("lix-inspector");
											if (!existing) {
												await initLixInspector({
													lix,
													show: false,
												});
											}
											// Programmatically toggle visibility
											toggleLixInspector();
										} catch (e) {
											console.error("Failed to toggle Lix Inspector", e);
										}
									}}
								>
									<Search />
									Toggle Lix Inspector
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={async () => {
										try {
											await seedMarkdownFiles(lix);
											console.log("Seeded Markdown files");
										} catch (e) {
											console.error("Seeding failed", e);
										}
									}}
								>
									<FilePlus />
									Seed Markdown files
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={async () => {
										try {
											await OpfsStorage.clean();
											window.location.reload();
										} catch (e) {
											console.error("Failed to reset OPFS", e);
										}
									}}
								>
									<RotateCcw />
									Reset OPFS
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
