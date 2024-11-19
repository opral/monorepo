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

export function AppSidebar() {
	const location = useLocation();

	return (
		<Sidebar
			className="w-[60px] h-screen border-r border-[#DBDFE7] bg-[#FCFCFD]"
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
						<SidebarMenuButton asChild isActive={location.pathname === "/"}>
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
							isActive={location.pathname === "/workflows"}
						>
							<a
								href="/workflows"
								className={`flex items-center justify-center w-9 h-9 rounded-md ${
									location.pathname === "/workflows"
										? "bg-[#E8EDF3]"
										: "hover:bg-[#E8EDF3]"
								}`}
							>
								<Workflow
									className={`h-4 w-4 ${
										location.pathname === "/workflows"
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
				<Avatar className="w-8 h-8">
					{/* INFO: If URL is not available, it uses the fallback */}
					<AvatarImage
						src="https://github.com/felixhaeberle.png"
						alt="@shadcn"
					/>
					<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
						FH
					</AvatarFallback>
				</Avatar>
			</SidebarFooter>
		</Sidebar>
	);
}
