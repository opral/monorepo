import { useState } from "react";
import { Button } from "@/components/plate-ui/button";
import clsx from "clsx";
import { checkpointChangeSetsAtom, intermediateChangesAtom, workingChangeSetAtom } from "@/state-active-file.ts";
import { useAtom } from "jotai/react";
import { Input } from "@/components/plate-ui/input.tsx";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import { UiDiffComponentProps, createCheckpoint, createThread } from "@lix-js/sdk";
import { lixAtom } from "@/state.ts";
import { ChangeDiffComponent } from "@/components/ChangeDiffComponent.tsx";
import ChangeDot from "@/components/ChangeDot.tsx";
import { ChevronDown } from "lucide-react";
import { fromPlainText, ZettelDoc } from "@lix-js/sdk/zettel-ast";

interface IntermediateCheckpointComponentProps {
  filteredChanges?: UiDiffComponentProps["diffs"];
}

export const IntermediateCheckpointComponent = ({ filteredChanges }: IntermediateCheckpointComponentProps) => {
  const [isExpandedState, setIsExpandedState] = useState<boolean>(true);
  const [intermediateChanges] = useAtom(intermediateChangesAtom);
  const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);

  // Use filtered changes if provided, otherwise use all intermediate changes
  const changesData = filteredChanges || intermediateChanges;

  // Don't render anything if there's no change data
  if (changesData.length === 0) {
    return null;
  }

  // Group changes by plugin_key
  const groupedChanges = changesData.reduce((acc: { [key: string]: UiDiffComponentProps["diffs"] }, change) => {
    const key = change.plugin_key;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(change);
    return acc;
  }, {});

  return (
    <div
      className="flex group hover:bg-slate-50 rounded-md cursor-pointer flex-shrink-0 pr-2"
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== "INPUT") {
          e.stopPropagation();
          setIsExpandedState(!isExpandedState);
        }
      }}
    >
      <ChangeDot top={false} bottom={checkpointChangeSets.length > 0} highlighted />
      <div className="flex-1 z-10">
        <div className="h-12 flex items-center w-full gap-2">
          <p className="flex-1 truncate text-ellipsis overflow-hidden text-sm">
            Intermediate changes{" "}
          </p>
          <div className="flex gap-3 items-center">
            <Button variant="ghost" size="icon">
              <ChevronDown
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
              <CreateCheckpointInput />
              {Object.keys(groupedChanges).map((pluginKey) => (
                <ChangeDiffComponent
                  key={pluginKey}
                  // TODO: Rework changes query to what we need
                  diffs={[changesData[changesData.length - 1]]}
                  contentClassName="text-sm" /* Set font size to 14px (text-sm in Tailwind) */
                // debug={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntermediateCheckpointComponent;

const CreateCheckpointInput = () => {
  const [description, setDescription] = useState("");
  const [lix] = useAtom(lixAtom);
  const [currentChangeSet] = useAtom(workingChangeSetAtom);

  const onThreadComposerSubmit = async (args: { content: ZettelDoc }) => {
    if (!description) return;

    lix.db.transaction().execute(async (trx) => {
      const thread = await createThread({
        lix: { ...lix, db: trx },
        comments: [{ body: args.content }],
      });
      await trx
        .insertInto("change_set_thread")
        .values({
          change_set_id: currentChangeSet!.id,
          thread_id: thread.id,
        })
        .execute();
    });
  };

  const handleCreateCheckpoint = async () => {
    await onThreadComposerSubmit({ content: fromPlainText(description!) });
    await createCheckpoint({ lix });
    await saveLixToOpfs({ lix });
  };

  // Handle key down in the comment textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateCheckpoint();
    }
  };

  return (
    <div className="flex flex-col w-full gap-2 px-1 items-end">
      {/* {currentChangeSet?.id} */}
      <Input
        className="flex-grow pl-2 bg-background text-sm placeholder:text-sm"
        placeholder="Describe the changes"
        onChange={(event) => setDescription(event.target.value)}
        onKeyDown={handleKeyDown}
        value={description}
      ></Input>
      <Button onClick={handleCreateCheckpoint}>
        Create checkpoint
      </Button>
    </div>
  );
};