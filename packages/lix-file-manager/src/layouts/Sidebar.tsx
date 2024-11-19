import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
} from "../../components/ui/sidebar.tsx";
import {
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "../../components/ui/sidebar.tsx";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/avatar.tsx";
import { File, Workflow } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usernameAtom } from "../state.ts";
import { useAtomValue } from "jotai";

interface AppSidebarProps {
	onSettingsClick?: (open: boolean) => void;
}

export function AppSidebar({ onSettingsClick }: AppSidebarProps) {
	const [username] = useAtomValue(usernameAtom);
	const location = useLocation();

	return (
		<Sidebar
			className="w-[60px] h-full border-r border-[#DBDFE7] bg-[#FCFCFD]"
			collapsible="none"
		>
			<SidebarHeader className="p-3 flex justify-center items-center">
				<a href="/">
					<img src="/lix.svg" alt="logo" className="w-6 h-6" />
				</a>
			</SidebarHeader>

			<SidebarContent className="flex-1">
				<SidebarMenu className="flex flex-col items-center gap-2">
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={location.pathname === "/"}
							className="w-9 h-9"
						>
							<a
								href="/"
								className={`flex items-center justify-center w-9 h-9 rounded-md ${
									location.pathname === "/"
										? "bg-[#E8EDF3]"
										: "hover:bg-[#E8EDF3]"
								}`}
							>
								<File
									className={`h-4 w-4 ${
										location.pathname === "/"
											? "text-[#141A21]"
											: "text-[#8C9AAD]"
									}`}
								/>
								<span className="sr-only">Files</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={location.pathname === "/automation"}
							className="w-9 h-9"
						>
							<a
								href="/automation"
								className={`flex items-center justify-center w-9 h-9 rounded-md ${
									location.pathname === "/automation"
										? "bg-[#E8EDF3]"
										: "hover:bg-[#E8EDF3]"
								}`}
							>
								<Workflow
									className={`h-4 w-4 ${
										location.pathname === "/automation"
											? "text-[#141A21]"
											: "text-[#8C9AAD]"
									}`}
								/>
								<span className="sr-only">Workflows</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter className="p-3 flex justify-center items-center">
				<Avatar
					className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity"
					onClick={() => onSettingsClick?.(true)}
				>
					<AvatarImage src="#" alt="#" />
					<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
						{username ? username.substring(0, 2).toUpperCase() : "XX"}
					</AvatarFallback>
				</Avatar>
			</SidebarFooter>
		</Sidebar>
	);
}
