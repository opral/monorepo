import { Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Version = {
	id: string;
	name: string;
	isActive?: boolean;
};

const SAMPLE_VERSIONS: Version[] = [
	{ id: "v-main", name: "Main", isActive: true },
	{ id: "v-draft", name: "Draft" },
	{ id: "v-review", name: "Review" },
];

export function VersionDropdown() {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(
		SAMPLE_VERSIONS.find((v) => v.isActive)?.id ?? SAMPLE_VERSIONS[0].id,
	);

	const current =
		SAMPLE_VERSIONS.find((v) => v.id === value) ?? SAMPLE_VERSIONS[0];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					aria-expanded={open}
					size="sm"
					className="gap-1 px-2"
				>
					<span>{current.name}</span>
					<ChevronDown
						className={`size-4 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[260px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Filter versions…" className="h-9" />
					<CommandList>
						<CommandEmpty>No versions found.</CommandEmpty>
						<CommandGroup>
							{SAMPLE_VERSIONS.map((v) => (
								<CommandItem
									key={v.id}
									value={v.name}
									onSelect={() => {
										setValue(v.id);
										setOpen(false);
									}}
								>
									{v.name}

									<Check
										className={cn(
											"ml-auto size-4",
											value === v.id ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
						<CommandGroup>
							<CommandItem value="__create" onSelect={() => setOpen(false)}>
								<Plus className="mr-2 size-4" /> Create new version
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
