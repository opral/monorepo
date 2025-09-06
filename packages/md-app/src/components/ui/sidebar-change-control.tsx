import CheckpointComponent from "../CheckpointComponent";
import IntermediateCheckpointComponent from "../IntermediateCheckpointComponent";
import { selectCheckpoints, selectWorkingChanges } from "@/queries";
import { SidebarHeader, SidebarSeparator } from "./multisidebar";
import { History } from "lucide-react";
import { useQuery } from "@lix-js/react-utils";

const ChangeControlSidebar = () => {
  const checkpoints = useQuery(({ lix }) => selectCheckpoints(lix));
  const workingChanges = useQuery(({ lix }) => selectWorkingChanges(lix));

  return (
    <div className="h-full flex flex-col relative">
      {/* Header with "Checkpoints" title */}
      <SidebarHeader className="flex flex-row items-center gap-2 pl-4 py-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm">Checkpoints</h2>
      </SidebarHeader>

      <div className="w-full px-2">
        <SidebarSeparator className="mx-0" />
      </div>

      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-1 px-2 pt-2">
        <IntermediateCheckpointComponent workingChanges={workingChanges} />
        {checkpoints && checkpoints.map((checkpoint, index) => {
          const previousCheckpointId = checkpoints[index + 1]?.id ?? undefined;
          return (
            <CheckpointComponent
              key={checkpoint.id}
              checkpointChangeSet={checkpoint}
              previousChangeSetId={previousCheckpointId}
              showTopLine={index !== 0 || workingChanges?.length > 0}
              showBottomLine={index !== (checkpoints.length || 0) - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ChangeControlSidebar;
