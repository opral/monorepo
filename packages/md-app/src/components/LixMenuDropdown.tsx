import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { lixAtom, withPollingAtom } from "@/state";
import { Lix, openLixInMemory, toBlob } from "@lix-js/sdk";
import { useAtom } from "jotai";
import posthog from "posthog-js";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./plate-ui/dropdown-menu";
import { Button } from "./plate-ui/button";
import { Download, Ellipsis, File, Merge, TrashIcon, Upload } from "lucide-react";

const LixHandlingDropdown = () => {
  // atoms
  const [lix] = useAtom(lixAtom);
  const [, setPolling] = useAtom(withPollingAtom);

  //hooks
  const navigate = useNavigate();

  // handlers
  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const importedFile = await lix.db
          .insertInto("file")
          .values({
            path: "/" + file.name,
            data: new Uint8Array(await file.arrayBuffer()),
          })
          .returning("id")
          .executeTakeFirstOrThrow();
        posthog.capture("File Imported", {
          fileName: file.name,
        });
        await saveLixToOpfs({ lix });
        navigate("?f=" + importedFile.id);
      }
    };
    input.click();
  };

  const handleOpenLixFile = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const fileContent = await file.arrayBuffer();
        const opfsRoot = await navigator.storage.getDirectory();
        const lix = await openLixInMemory({
          blob: new Blob([fileContent]),
        });
        const lixId = await lix.db
          .selectFrom("key_value")
          .where("key", "=", "lix_id")
          .select("value")
          .executeTakeFirstOrThrow();

        const opfsFile = await opfsRoot.getFileHandle(`${lixId.value}.lix`, {
          create: true,
        });
        const writable = await opfsFile.createWritable();
        await writable.write(fileContent);
        await writable.close();
        navigate("?l=" + lixId.value);
      }
    };
    input.click();
  };

  const handleMerge = async () => {
    if (!lix) return;

    try {
      // Open file picker for .lix files
      const input = document.createElement("input");
      input.type = "file";
      // TODO: Add .lix to accept
      // input.accept = ".lix";

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Read the file and merge it
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result;
          if (!content || typeof content !== "string") return;

          try {
            // TODO: Implement actual merge logic here
            alert("Merge functionality not yet implemented");
          } catch (error) {
            console.error("Merge failed:", error);
          }
        };
        reader.readAsText(file);
      };

      input.click();
    } catch (error) {
      console.error("Merge failed:", error);
      alert("Merge failed. See console for details.");
    }
  };

  const handleExportLixFile = async (lix: Lix) => {
    const lixId = await lix.db
      .selectFrom("key_value")
      .where("key", "=", "lix_id")
      .select("value")
      .executeTakeFirstOrThrow();

    const blob = await toBlob({ lix });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${lixId.value}.lix`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleImport}>
          <Upload />
          Import File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenLixFile}>
          <File />
          Open Lix
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportLixFile(lix)}>
          <Download />
          Export Lix
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMerge}>
          <Merge />
          Merge Lix
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            try {
              const root = await navigator.storage.getDirectory();
              // @ts-expect-error - TS doesn't know about values() yet
              for await (const entry of root.values()) {
                if (entry.kind === "file") {
                  await root.removeEntry(entry.name);
                }
              }
              navigate("/");
              // trigger "polling" reset all atoms
              setPolling(Date.now());
              console.log("All files deleted from OPFS.");
            } catch (error) {
              console.error("Error deleting files from OPFS:", error);
            }
          }}
        >
          <TrashIcon />
          Reset OPFS
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LixHandlingDropdown;