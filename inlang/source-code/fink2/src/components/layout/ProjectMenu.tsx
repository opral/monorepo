import { SlDropdown, SlMenu, SlMenuItem, SlBadge } from "@shoelace-style/shoelace/dist/react";
import { exportToJSON, handleDownload, handleMerge, handleOpenProject, selectImportFile } from "../../helper/utils.ts";
import { forceReloadProjectAtom, projectAtom, selectedProjectPathAtom } from "../../state.ts";
import { useAtom } from "jotai";
import CreateProjectDialog from "./CreateProjectDialog.tsx";
import ImportLocaleDialog from "./ImportLocaleDialog.tsx";
import { useState } from "react";

const ProjectMenu = () => {
  const [project] = useAtom(projectAtom);
  const [selectedProjectPath, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);
  const [, setForceReloadProject] = useAtom(forceReloadProjectAtom);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [importedFile, setImportedFile] = useState<File | undefined>(undefined);
  const [importPlugin, setImportPlugin] = useState<"plugin.inlang.i18next" | "plugin.inlang.messageFormat" | undefined>(undefined);

  return (
    <div className="flex items-center gap-1">
      <p className="text-[16px]">Fink</p>
      <SlDropdown distance={4}>
        <div
          slot="trigger"
          className="h-8 px-1 hover:bg-zinc-100 flex justify-center items-center rounded-lg text-zinc-500 hover:text-zinc-950 cursor-pointer"
        >
          {/* Down arrow icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill={"currentColor"}
          >
            <path d="M480-333 240-573l51-51 189 189 189-189 51 51-240 240Z" />
          </svg>
        </div>
        <SlMenu>
          <SlMenuItem value="new" onClick={() => setShowNewProjectDialog(true)}>New project</SlMenuItem>
          <SlMenuItem value="open" onClick={() => handleOpenProject(setSelectedProjectPath)}>Open project</SlMenuItem>
          <div className="w-full border-b border-zinc-200 my-1" />
          <SlMenuItem value="download" onClick={() => handleDownload(project, selectedProjectPath)}>Download file</SlMenuItem>
          <SlMenuItem value="merge" onClick={() => handleMerge(project, selectedProjectPath, setForceReloadProject)}>Merge file</SlMenuItem>
          <div className="w-full border-b border-zinc-200 my-1" />
          <SlMenuItem>
            Import
            <SlMenu slot="submenu">
              <SlMenuItem value="import JSON" onClick={async () => {
                setImportedFile(await selectImportFile(".json"))
                setImportPlugin("plugin.inlang.i18next")
              }}>
                JSON
                <SlBadge pill variant="neutral" className="ml-2">i18next</SlBadge>
              </SlMenuItem>
              {/* <SlMenuItem value="import JSON" onClick={async () => {
                setImportedFile(await selectImportFile(".json"))
                setImportPlugin("plugin.inlang.messageFormat")
              }}>
                Message format
              </SlMenuItem> */}
            </SlMenu>
          </SlMenuItem>
          <SlMenuItem>
            Export
            <SlMenu slot="submenu">
              <SlMenuItem value="export JSON" onClick={() => exportToJSON(project)}>
                JSON
                <SlBadge pill variant="neutral" className="ml-2">i18next</SlBadge>
              </SlMenuItem>
              {/* <SlMenuItem value="export message format" onClick={() => exportToJSON(project)}>
                Message format
              </SlMenuItem> */}
            </SlMenu>
          </SlMenuItem>
        </SlMenu>
      </SlDropdown>
      <CreateProjectDialog
        showNewProjectDialog={showNewProjectDialog}
        setShowNewProjectDialog={setShowNewProjectDialog}
      />
      <ImportLocaleDialog
        importedFile={importedFile}
        setImportedFile={setImportedFile}
        importPlugin={importPlugin}
        setImportPlugin={setImportPlugin}
      />
    </div>
  )
};

export default ProjectMenu;