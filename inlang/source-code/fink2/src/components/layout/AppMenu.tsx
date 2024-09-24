import { useState } from "react";
import { SlDropdown, SlMenu, SlMenuItem } from "@shoelace-style/shoelace/dist/react";
import CreateProjectDialog from "./CreateProjectDialog.tsx";
import { SlSelectEvent } from "@shoelace-style/shoelace";
import { useAtom } from "jotai";
import { selectedProjectPathAtom } from "../../state.ts";

const AppMenu = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

  const handleOpen = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".inlang";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const blob = new Blob([reader.result as ArrayBuffer]);
          const opfsRoot = await navigator.storage.getDirectory();
          const fileHandle = await opfsRoot.getFileHandle(file.name, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          setSelectedProjectPath(file!.name);
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  const handleSelect = async (event: SlSelectEvent) => {
    switch (event.detail.item.value) {
      case "new":
        setShowNewProjectDialog(true);
        break;
      case "open":
        handleOpen();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <SlDropdown distance={8}>
        <div
          slot="trigger"
          className="flex justify-center items-center w-8 h-8 text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer -ml-[2px]"
        >
          {/* Burger menu icon */}
          <svg
            className="-mx-2 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
          </svg>
        </div>
        <SlMenu onSlSelect={handleSelect}>
          <SlMenuItem value="new">New project</SlMenuItem>
          <SlMenuItem value="open">Open file</SlMenuItem>
        </SlMenu>
      </SlDropdown>
      <CreateProjectDialog
        showNewProjectDialog={showNewProjectDialog}
        setShowNewProjectDialog={setShowNewProjectDialog}
      />
    </>
  );
};

export default AppMenu;