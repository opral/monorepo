import { type LucideIcon } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
	active,
	onSelect,
}: {
	items: {
		key: string;
		title: string;
		// Prefer static icon; optionally provide a renderer that
		// can switch based on active state.
		icon?: LucideIcon;
		renderIcon?: (isActive: boolean) => React.ReactNode;
		isActive?: boolean;
	}[];
	active: string | null;
	onSelect: (key: string) => void;
}) {
	const { state: _state } = useSidebar();
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.key}>
						<SidebarMenuButton
							isActive={active === item.key}
							onClick={() => onSelect(item.key)}
							className={`rounded-l-none rounded-r-md data-[active=true]:bg-transparent data-[active=true]:text-sidebar-foreground data-[active=true]:font-normal cursor-pointer overflow-visible [&>svg]:size-5 ${
								active === item.key
									? "relative before:content-[''] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-[2.5px] before:bg-amber-500"
									: ""
							}`}
						>
							{item.renderIcon ? (
								item.renderIcon(active === item.key)
							) : item.icon ? (
								<item.icon />
							) : null}
							<span>{item.title}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
