import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import ChangeDot from "./ChangeDot.tsx";
import IconChevron from "@/components/icons/IconChevron.tsx";
import clsx from "clsx";
import { checkpointChangeSetsAtom, intermediateChangesAtom } from "@/state-active-file.ts";
import { useAtom } from "jotai/react";

export const IntermediateCheckpointComponent = () => {
  const [isExpandedState, setIsExpandedState] = useState<boolean>(false);
  const [intermediateChanges] = useAtom(intermediateChangesAtom);
  const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);

  // Don't render anything if there's no change data
  if (intermediateChanges.length === 0) {
    return null;
  }

  return (
    <div
      className="flex group hover:bg-slate-50 rounded-md cursor-pointer flex-shrink-0 pr-2"
      onClick={(e) => {
        e.stopPropagation();
        setIsExpandedState(!isExpandedState);
      }}
    >
      <ChangeDot top={false} bottom={checkpointChangeSets.length > 0} highlighted />
      <div className="flex-1">
        <div className="h-12 flex items-center w-full gap-2">
          <p className="flex-1 truncate text-ellipsis overflow-hidden">
            Intermediate changes{" "}
          </p>
          <div className="flex gap-3 items-center">
            {/* show time of changes oldest - newest */}
            {/* list authors with avatars */}
            <Button variant="ghost" size="icon">
              <IconChevron
                className={clsx(
                  isExpandedState ? "rotate-180" : "rotate-0",
                  "transition"
                )}
              />
            </Button>
          </div>
        </div>
        {isExpandedState && (
          <div className="flex flex-col gap-2 pb-2">
            <div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 pt-2 pb-4 sm:pb-6 overflow-hidden">
              {/* Create checkpoint with/without description */}
              {/* List all intermediate changes as diff */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntermediateCheckpointComponent;
