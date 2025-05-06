import { useAtom } from "jotai";
import { useCallback } from "react";
import { activeFileAtom } from "@/state-active-file";
import { filesAtom, lixAtom, withPollingAtom } from "@/state";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { updateUrlParams } from "@/helper/updateUrlParams";
import { generateHumanId } from "@/helper/generateHumanId";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./plate-ui/dropdown-menu";
import { Button } from "./plate-ui/button";
import { Check, ChevronDown, FileText, Plus } from "lucide-react";


export default function FileSwitcher() {
  const [activeFile] = useAtom(activeFileAtom);
  const [files] = useAtom(filesAtom);
  const [lix] = useAtom(lixAtom);
  const [, setPolling] = useAtom(withPollingAtom);

  const switchToFile = useCallback(
    async (fileId: string) => {
      // Update URL without causing a navigation
      updateUrlParams({ f: fileId });

      // Trigger polling to refresh state without full page reload
      setPolling(Date.now());
    },
    [setPolling]
  );

  const createNewFile = useCallback(async () => {
    if (!lix) return;

    const fileName = generateHumanId();

    try {
      // Create a new file in the database
      const newFile = await lix.db
        .insertInto("file")
        .values({
          path: `/${fileName}.md`,
          data: new TextEncoder().encode(``),
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      // Save the changes to OPFS
      await saveLixToOpfs({ lix });

      // Update URL without full navigation
      updateUrlParams({ f: newFile.id });

      // Refresh state
      setPolling(Date.now()); 
    } catch (error) {
      console.error("Failed to create new file:", error);
    }
  }, [lix, setPolling]);

  if (!activeFile) return null;

  // Filter only markdown files (assuming they end with .md)
  const mdFiles = files.filter(file => file.path.endsWith('.md'));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          {activeFile.path.split('/').pop()}
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
              <span>{file.path.split('/').pop()}</span>
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