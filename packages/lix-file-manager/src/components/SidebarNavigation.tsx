import { useLocation } from "react-router-dom";
import {
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar.js";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip.js";
import IconFile from "@/components/icons/IconFile.js";
import IconAutomation from "@/components/icons/IconAutomation.js";
import clsx from "clsx";
import React from "react";
import CustomLink from "./CustomLink.tsx";

export function SidebarNavigation() {
	return (
		<SidebarMenu className="flex flex-col items-center gap-2">
			<NavigationItem path="/" icon={<IconFile />} label="Files" />
			<NavigationItem
				path="/automation"
				icon={<IconAutomation />}
				label="Automations"
			/>
		</SidebarMenu>
	);
}

function NavigationItem({
	path,
	icon,
	label,
}: {
	path: string;
	icon: React.ReactNode;
	label: string;
}) {
	const location = useLocation();
	const isActive = location.pathname === path;

	return (
		<SidebarMenuItem>
			<Tooltip>
				<TooltipTrigger asChild>
					<SidebarMenuButton
						asChild
						isActive={isActive}
						className={clsx(
							"w-9 h-9",
							isActive ? "bg-slate-200" : "hover:bg-slate-100"
						)}
					>
						<CustomLink
							to={path}
							className={clsx(
								"flex items-center justify-center w-9 h-9 rounded-md",
								isActive ? "bg-slate-200" : "hover:bg-slate-100"
							)}
						>
							{React.cloneElement(icon as React.ReactElement, {
								className: clsx(
									"h-4 w-4",
									isActive ? "text-slate-950" : "text-slate-700"
								),
							})}
							<span className="sr-only">{label}</span>
						</CustomLink>
					</SidebarMenuButton>
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={20}>
					{label}
				</TooltipContent>
			</Tooltip>
		</SidebarMenuItem>
	);
}
