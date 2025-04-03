import CheckpointComponent from "../CheckpointComponent";
import IntermediateCheckpointComponent from "../IntermediateCheckpointComponent";
import { useAtom } from "jotai/react";
import { activeFileAtom, checkpointChangeSetsAtom, intermediateChangesAtom } from "@/state-active-file";
import { useMemo } from "react";
import { isEqual } from "lodash-es";

const ChangeControlSidebar = () => {
  const [activeFile] = useAtom(activeFileAtom)
  const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);
  const [intermediateChanges] = useAtom(intermediateChangesAtom);

  // Filter out changes where before and after content are identical (ghost changes)
  const filteredChanges = useMemo(() => {
    return intermediateChanges.filter(change => {
      // Only show changes where the content has actually changed
      return !isEqual(change.snapshot_content_before, change.snapshot_content_after);
    });
  }, [intermediateChanges, activeFile]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="px-[10px] pt-[10px] overflow-y-auto flex-1">
        <IntermediateCheckpointComponent filteredChanges={filteredChanges} />
        {checkpointChangeSets.map((checkpointChangeSet, i) => {
          return (
            <CheckpointComponent
              key={checkpointChangeSet.id}
              checkpointChangeSet={checkpointChangeSet}
              showTopLine={i !== 0 || filteredChanges.length > 0}
              showBottomLine={i !== checkpointChangeSets.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ChangeControlSidebar;