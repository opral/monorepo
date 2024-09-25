import { SlDropdown, SlMenu, SlMenuItem, SlBadge } from "@shoelace-style/shoelace/dist/react";
import { exportToJSON, handleDownload, handleMerge, handleOpenProject, importFromJSON } from "../../helper/utils.ts";
import { forceReloadProjectAtom, projectAtom, selectedProjectPathAtom } from "../../state.ts";
import { useAtom } from "jotai";
import CreateProjectDialog from "./CreateProjectDialog.tsx";
import { useState } from "react";

const ProjectMenu = () => {
  const [project] = useAtom(projectAtom);
  const [selectedProjectPath, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);
  const [, setForceReloadProject] = useAtom(forceReloadProjectAtom);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const menuPoints = [
    { value: "new", label: "New project", function: () => setShowNewProjectDialog(true) },
    { value: "open", label: "Open project", function: () => handleOpenProject(setSelectedProjectPath) },
    { value: "download", label: "Download file", function: () => handleDownload(project, selectedProjectPath) },
    { value: "merge", label: "Merge file", function: () => handleMerge(project, selectedProjectPath, setForceReloadProject) },
    { value: "import", label: "Import from JSON", pill: "i18next", function: () => importFromJSON(project) },
    { value: "export", label: "Export to JSON", pill: "i18next", function: () => exportToJSON(project) },
  ]

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
          {menuPoints.map((point) => (
            <>
              <SlMenuItem key={point.value} value={point.value} onClick={point.function}>
                {point.label}
                {point.pill && (
                  <SlBadge pill variant="neutral" className="ml-2">
                    {point.pill}
                  </SlBadge>
                )}
              </SlMenuItem>
              {(point.value === "merge" || point.value === "open") && (
                <div className="w-full border-b border-zinc-200 my-1" />
              )}
            </>
          ))}
        </SlMenu>
      </SlDropdown>
      <CreateProjectDialog
        showNewProjectDialog={showNewProjectDialog}
        setShowNewProjectDialog={setShowNewProjectDialog}
      />
    </div>
  )
};

export default ProjectMenu;