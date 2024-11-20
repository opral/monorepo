import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "../../components/ui/sidebar.tsx";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../components/ui/tooltip.tsx";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/avatar.tsx";
import { Link, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import clsx from "clsx";
import IconFile from "./../components/icons/IconFile.tsx";
import IconAutomation from "./../components/icons/IconAutomation.tsx";
import { userAtom } from "../state.ts";

interface AppSidebarProps {
	onSettingsClick?: (open: boolean) => void;
}

export function AppSidebar({ onSettingsClick }: AppSidebarProps) {
	const [user] = useAtom(userAtom);
	const location = useLocation();

	return (
		<Sidebar
			className="w-14 h-full border-r border-[#DBDFE7] bg-[#FCFCFD]"
			collapsible="none"
		>
			<TooltipProvider>
				<SidebarHeader className="w-14 h-[60px] flex justify-center items-center">
					<a href="/">
						<img src="/lix.svg" alt="logo" className="w-6 h-6" />
					</a>
				</SidebarHeader>

				<SidebarContent className="flex-1 pt-1.5">
					<SidebarMenu className="flex flex-col items-center gap-2">
						<SidebarMenuItem>
							<Tooltip>
								<TooltipTrigger asChild>
									<SidebarMenuButton
										asChild
										isActive={location.pathname === "/"}
										className={clsx(
											"w-9 h-9",
											location.pathname === "/"
												? "bg-slate-200"
												: "hover:bg-slate-100"
										)}
									>
										<Link
											to="/"
											className={`flex items-center justify-center w-9 h-9 rounded-md ${
												location.pathname === "/"
													? " bg-slate-200"
													: " hover:bg-slate-100"
											}`}
										>
											<IconFile
												className={`h-4 w-4 ${
													location.pathname === "/"
														? "text-slate-950"
														: "text-slate-700"
												}`}
											/>
											<span className="sr-only">Files</span>
										</Link>
									</SidebarMenuButton>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={20}>
									Files
								</TooltipContent>
							</Tooltip>
						</SidebarMenuItem>

						<SidebarMenuItem>
							<Tooltip>
								<TooltipTrigger asChild>
									<SidebarMenuButton
										asChild
										isActive={location.pathname === "/automation"}
										className="w-9 h-9"
									>
										<Link
											to="/automation"
											className={`flex items-center justify-center w-9 h-9 rounded-md ${
												location.pathname === "/automation"
													? " bg-slate-200"
													: " hover:bg-slate-100"
											}`}
										>
											<IconAutomation
												className={`h-6 w-6 ${
													location.pathname === "/automation"
														? "text-slate-950"
														: "text-slate-700"
												}`}
											/>
											<span className="sr-only">Workflows</span>
										</Link>
									</SidebarMenuButton>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={20}>
									Automations
								</TooltipContent>
							</Tooltip>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarContent>

				<SidebarFooter className="p-3 flex justify-center items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<Avatar
								className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity"
								onClick={() => onSettingsClick?.(true)}
							>
								<AvatarImage src="#" alt="#" />
								<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
									{user?.username
										? user.username.substring(0, 2).toUpperCase()
										: "XX"}
								</AvatarFallback>
							</Avatar>
						</TooltipTrigger>
						<TooltipContent side="right" sideOffset={20}>
							Settings
						</TooltipContent>
					</Tooltip>
				</SidebarFooter>
			</TooltipProvider>
		</Sidebar>
	);
}
