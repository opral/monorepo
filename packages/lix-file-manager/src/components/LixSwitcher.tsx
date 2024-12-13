import { useAtom } from "jotai";
import { Button } from "./ui/button.js";
import { lixIdAtom } from "../state.js";
import { DEMO_FILE_IDS } from "../helper/demo-lix-file/demoLixFile.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "./ui/dropdown-menu.js";
import { ChevronDown, Check, Plus } from "lucide-react";
import { nanoid } from "nanoid";

export function LixSwitcher() {
	const [currentLixId, setLixId] = useAtom(lixIdAtom);

	const handleCreateNew = () => {
		const newLixId = nanoid(10);
		setLixId(newLixId);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary" size="default" className="gap-2">
					{currentLixId?.split("-").pop() || "Select Lix"}
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{DEMO_FILE_IDS.map((id) => (
					<DropdownMenuItem
						key={id}
						onClick={() => setLixId(id)}
						className="flex items-center justify-between group"
					>
						<div className="flex items-center gap-2">
							<span>{id.split("-").pop()}</span>
						</div>
						{id === currentLixId && <Check className="h-4 w-4 opacity-50" />}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleCreateNew}>
					<Plus className="h-4 w-4 mr-2" />
					Create new lix
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
