import {
	FileDown,
	FilePlus,
	FileUp,
	Hammer,
	RotateCcw,
	Search,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useLix } from "@lix-js/react-utils";
import { toggleLixInspector } from "@lix-js/inspector";
import { seedMarkdownFiles } from "@/seed";
import { OpfsSahEnvironment } from "@lix-js/sdk";

/**
 * Dropdown launcher for flashtype developer utilities.
 *
 * @example
 * <FlashtypeMenu />
 */
export function FlashtypeMenu() {
	const lix = useLix();

	const handleOpenLix = async () => {
		try {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".lix";
			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;
				try {
					// Close current lix instance
					if (lix) {
						try {
							await lix.close();
						} catch {
							// ignore close errors so we can still proceed
						}
					}
					// Clear OPFS to remove old database
					await OpfsSahEnvironment.clear();
					// Store the new file in OPFS
					const env = new OpfsSahEnvironment({ key: "flashtype" });
					await env.create({ blob: await file.arrayBuffer() });
					// Reload to open the new file
					window.location.reload();
				} catch (error) {
					console.error("Failed to open Lix file", error);
					alert("Failed to open Lix file. Please try again.");
				}
			};
			input.click();
		} catch (error) {
			console.error("Failed to open file picker", error);
		}
	};

	const handleExportLix = async () => {
		if (!lix) return;
		try {
			const blob = await lix.toBlob();
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `flashtype-export-${new Date()
				.toISOString()
				.slice(0, 10)}.lix`;
			document.body.appendChild(anchor);
			anchor.click();
			window.setTimeout(() => {
				document.body.removeChild(anchor);
				URL.revokeObjectURL(url);
			}, 100);
		} catch (error) {
			console.error("Failed to export Lix blob", error);
		}
	};

	const handleToggleInspector = async () => {
		try {
			await toggleLixInspector();
		} catch (error) {
			console.error("Failed to toggle Lix Inspector", error);
		}
	};

	const handleSeedMarkdown = async () => {
		if (!lix) return;
		try {
			await seedMarkdownFiles(lix);
			console.log("Seeded Markdown files");
		} catch (error) {
			console.error("Seeding failed", error);
		}
	};

	const handleResetOpfs = async () => {
		try {
			if (lix) {
				try {
					await lix.close();
				} catch {
					// ignore close errors so we can still reset
				}
			}
			await OpfsSahEnvironment.clear();
			window.location.reload();
		} catch (error) {
			console.error("Failed to reset OPFS", error);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 data-[state=open]:bg-neutral-200 data-[state=open]:text-neutral-900"
				>
					<Zap className="size-4 text-brand-600" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-48 rounded-lg text-sm"
				align="start"
				side="bottom"
				sideOffset={6}
			>
				<DropdownMenuItem
					className="flex items-center gap-1.5 text-xs"
					onSelect={() => {
						void handleOpenLix();
					}}
				>
					<FileUp className="h-3.5 w-3.5 shrink-0" />
					<span>Open lix file</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-1.5 text-xs"
					onSelect={() => {
						void handleExportLix();
					}}
				>
					<FileDown className="h-3.5 w-3.5 shrink-0" />
					<span>Export lix file</span>
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="flex items-center gap-1.5 text-xs">
						<Hammer className="h-3.5 w-3.5 shrink-0" />
						<span>Developer tools</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className="min-w-56 text-xs">
						<DropdownMenuItem
							className="gap-1.5 text-xs"
							onSelect={() => {
								void handleToggleInspector();
							}}
						>
							<Search className="h-3.5 w-3.5" />
							<span>Toggle Lix Inspector</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="gap-1.5 text-xs"
							onSelect={() => {
								void handleSeedMarkdown();
							}}
						>
							<FilePlus className="h-3.5 w-3.5" />
							<span>Seed Markdown files</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="gap-1.5 text-xs"
							onSelect={() => {
								void handleResetOpfs();
							}}
						>
							<RotateCcw className="h-3.5 w-3.5" />
							<span>Reset OPFS</span>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
