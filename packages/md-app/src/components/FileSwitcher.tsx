import { useCallback } from "react";
import { useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import { selectActiveFile, selectFiles } from "@/queries";
import { updateUrlParams } from "@/helper/updateUrlParams";
import { generateHumanId } from "@/helper/generateHumanId";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Check, ChevronDown, FileText, Plus } from "lucide-react";
import { useLix } from "@lix-js/react-utils";
import { nanoId } from "@lix-js/sdk";

export default function FileSwitcher() {
	const activeFile = useQueryTakeFirst(selectActiveFile);
	const files = useQuery(selectFiles);
	const lix = useLix();

	const switchToFile = useCallback(
		async (fileId: string) => {
			// Update URL without causing a navigation
			updateUrlParams({ f: fileId });
			// Data will automatically refresh via reactive queries
		},
		[]
	);

	const createNewFile = useCallback(async () => {
		if (!lix) return;

		const fileName = generateHumanId();

		try {
			const newFileId = nanoId({ lix });

			// Create a new file in the database
			await lix.db
				.insertInto("file")
				.values({
					id: newFileId,
					path: `/${fileName}.md`,
					data: new TextEncoder().encode(``),
				})
				.executeTakeFirstOrThrow();

			// OpfsStorage now handles persistence automatically through the onStateCommit hook

			// Update URL without full navigation
			updateUrlParams({ f: newFileId });
		} catch (error) {
			console.error("Failed to create new file:", error);
		}
	}, [lix]);

	if (!activeFile) return null;

	// Filter only markdown files (assuming they end with .md)
	const mdFiles = files ? files.filter((file) => file.path.endsWith(".md")) : [];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="gap-2">
					<FileText className="h-4 w-4" />
					{activeFile.path.split("/").pop()}
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56 py-1">
				{mdFiles.map((file) => (
					<DropdownMenuItem
						key={file.id}
						onClick={() => switchToFile(file.id)}
						className="flex items-center justify-between group"
					>
						<div className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							<span>{file.path.split("/").pop()}</span>
						</div>
						{file.id === activeFile.id && (
							<Check className="h-4 w-4 opacity-50" />
						)}
					</DropdownMenuItem>
				))}
				{mdFiles.length === 0 && (
					<DropdownMenuItem disabled>No markdown files found</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={createNewFile}>
					<Plus className="h-4 w-4" />
					Create new file
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}