import * as React from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import { useKeyValue } from "@/key-value/use-key-value";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from "@/components/ui/sidebar";

type TreeNode = string | [string, ...TreeNode[]];

const sampleTree: TreeNode[] = [
	[
		"app",
		[
			"api",
			["hello", ["route.ts"]],
			"page.tsx",
			"layout.tsx",
			["blog", ["page.tsx"]],
		],
	],
	["components", ["ui", "button.tsx", "card.tsx"], "header.tsx", "footer.tsx"],
	["lib", ["util.ts"]],
	["public", "favicon.ico", "vercel.svg"],
	".eslintrc.json",
	".gitignore",
	"next.config.js",
	"tailwind.config.js",
	"package.json",
	"README.md",
];

export function LeftSidebarFiles() {
	const [activeFileId, setActiveFileId] = useKeyValue(
		"flashtype_active_file_id",
	);
	return (
		<SidebarMenu>
			{sampleTree.map((item, i) => (
				<Tree
					key={i}
					item={item}
					activeId={activeFileId}
					onSelect={setActiveFileId}
				/>
			))}
		</SidebarMenu>
	);
}

function Tree({
	item,
	activeId,
	onSelect,
}: {
	item: TreeNode;
	activeId: string | null;
	onSelect: (id: string) => Promise<void>;
}) {
	const [name, ...items] = Array.isArray(item) ? item : [item];

	if (!items.length) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					isActive={activeId === (name as string)}
					onClick={() => onSelect(name as string)}
					className="data-[active=true]:bg-secondary cursor-pointer"
				>
					<File />
					{name as string}
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
				<CollapsibleTrigger asChild>
					<SidebarMenuButton className="cursor-pointer">
						<ChevronRight className="transition-transform" />
						<Folder />
						{name as string}
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{items.map((subItem, idx) => (
							<Tree
								key={idx}
								item={subItem}
								activeId={activeId}
								onSelect={onSelect}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}
