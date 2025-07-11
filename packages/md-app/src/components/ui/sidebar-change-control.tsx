import CheckpointComponent from "../CheckpointComponent";
import IntermediateCheckpointComponent from "../IntermediateCheckpointComponent";
import { useQuery } from "@/hooks/useQuery";
import { selectActiveFile, selectCheckpointChangeSets, selectIntermediateChanges } from "@/queries";
import { useMemo } from "react";
import { isEqual } from "lodash-es";
import { SidebarHeader, SidebarSeparator } from "./multisidebar";
import { History } from "lucide-react";

const ChangeControlSidebar = () => {
  const [activeFile] = useQuery(selectActiveFile);
  const [checkpointChangeSets] = useQuery(selectCheckpointChangeSets, 2000); // Reduced frequency for better performance
  const [intermediateChanges] = useQuery(selectIntermediateChanges);

  // Filter out changes where before and after content are identical (ghost changes)
  const filteredChanges = useMemo(() => {
    return intermediateChanges ? intermediateChanges.filter(change => {
      // Only show changes where the content has actually changed
      return !isEqual(change.snapshot_content_before, change.snapshot_content_after);
    }) : [];
  }, [intermediateChanges, activeFile]);

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
        <IntermediateCheckpointComponent filteredChanges={filteredChanges} />
        {checkpointChangeSets && checkpointChangeSets.map((checkpointChangeSet, index) => {
          const previousCheckpointId = checkpointChangeSets[index + 1]?.id ?? undefined;
          return (
            <CheckpointComponent
              key={checkpointChangeSet.id}
              checkpointChangeSet={checkpointChangeSet}
              previousChangeSetId={previousCheckpointId}
              showTopLine={index !== 0 || filteredChanges.length > 0}
              showBottomLine={index !== (checkpointChangeSets?.length || 0) - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ChangeControlSidebar;