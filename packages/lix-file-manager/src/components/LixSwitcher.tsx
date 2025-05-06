import { useAtom } from "jotai";
import { Button } from "./ui/button.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "./ui/dropdown-menu.js";
import { Check, ChevronDown, Plus } from "lucide-react";
import { availableLixFilesInOpfsAtom } from "@/state.ts";
import { useSearchParams } from "react-router-dom";
import { createNewLixFileInOpfs } from "@/helper/new-lix.ts";

export function LixSwitcher() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [availableLixFiles] = useAtom(availableLixFilesInOpfsAtom);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary" size="default" className="gap-2">
					{searchParams.get("lix")?.split("-").pop() || "Select Lix"}
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{availableLixFiles.map((path) => {
					const lixId = path.split(".lix")[0]!;
					return (
						<DropdownMenuItem
							key={path}
							onClick={() => setSearchParams({ lix: lixId })}
							className="flex items-center justify-between group"
						>
							<div className="flex items-center gap-2">
								<span>{lixId}</span>
							</div>
							{lixId === searchParams.get("lix") && (
								<Check className="h-4 w-4 opacity-50" />
							)}
						</DropdownMenuItem>
					);
				})}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={async () => {
						const { id } = await createNewLixFileInOpfs();
						setSearchParams({ lix: id });
					}}
				>
					<Plus className="h-4 w-4 mr-2" />
					Create new lix
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
