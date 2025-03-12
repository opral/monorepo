import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/plate-ui/avatar.tsx";
import { Button } from "@/components/plate-ui/button.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/plate-ui/tooltip.tsx";
import { Input } from "@/components/plate-ui/input.tsx";
import timeAgo from "@/helper/timeAgo.ts";
import clsx from "clsx";
import ChangeDot from "./ChangeDot.tsx";
import DiscussionPreview from "@/components/DiscussionPreview.tsx";
import { ChangeSet, createDiscussion, UiDiffComponentProps } from "@lix-js/sdk";
import { useAtom } from "jotai/react";
import { currentVersionAtom, lixAtom } from "@/state.ts";
import { ChangeDiffComponent } from "@/components/ChangeDiffComponent.tsx";
import { activeFileAtom, getChangeDiffs } from "@/state-active-file.ts";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import { ChevronDown } from "lucide-react";

export const CheckpointComponent = (props: {
  checkpointChangeSet: {
    id: string;
    discussion_id: string | null;
    first_comment_content: string | null;
    author_name: string;
    checkpoint_created_at: string | null;
  }
  showTopLine: boolean;
  showBottomLine: boolean;
}) => {
  const [lix] = useAtom(lixAtom);
  const [currentVersion] = useAtom(currentVersionAtom);
  const [activeFile] = useAtom(activeFileAtom);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [diffs, setDiffs] = useState<UiDiffComponentProps["diffs"]>([]);

  // Don't render anything if there's no change data
  if (!props.checkpointChangeSet || !props.checkpointChangeSet.id) {
    return null;
  }

  const toggleExpanded = () => {
    if (diffs.length > 0) {
      setIsExpanded(!isExpanded);
      return;
    }

    getChangeDiffs(lix, props.checkpointChangeSet.id, currentVersion!, activeFile).then((diffs) => {
      setDiffs(diffs);
      setIsExpanded(true);
    });
  };

  // Group changes by plugin_key
  const groupedChanges = diffs.reduce((acc: { [key: string]: UiDiffComponentProps["diffs"] }, change) => {
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
          toggleExpanded();
        }
      }}
    >
      <ChangeDot top={props.showTopLine} bottom={props.showBottomLine} />
      <div className="flex-1">
        <div className="h-12 flex items-center w-full">
          <p className="flex-1 truncate text-ellipsis overflow-hidden">
            {props.checkpointChangeSet.author_name}:{" "}
            <span className="text-slate-500">
              {props.checkpointChangeSet.first_comment_content || "Create checkpoint"}
            </span>
          </p>
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-slate-500 block pr-2">
              {timeAgo(props.checkpointChangeSet.checkpoint_created_at!)}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity">
                    <AvatarImage src="#" alt="#" />
                    <AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
                      {props.checkpointChangeSet.author_name
                        ? props.checkpointChangeSet.author_name
                          .substring(0, 2)
                          .toUpperCase()
                        : "XX"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{props.checkpointChangeSet.author_name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon">
              <ChevronDown
                className={clsx(
                  isExpanded ? "rotate-180" : "rotate-0",
                  "transition"
                )}
              />
            </Button>
          </div>
        </div>
        {isExpanded && (
          <div className="flex flex-col gap-2 pb-2">
            {/* Option to introduce tabs - Discussion | Changes */}
            <div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 pt-2 pb-4 sm:pb-6 overflow-hidden">
              {Object.keys(groupedChanges).map((pluginKey) => (
                <ChangeDiffComponent
                  key={pluginKey}
                  diffs={groupedChanges[pluginKey]}
                // debug={true}
                />
              ))}
            </div>
            {props.checkpointChangeSet.discussion_id ? (
              <DiscussionPreview
                key={props.checkpointChangeSet.discussion_id}
                discussionId={props.checkpointChangeSet.discussion_id}
              />
            ) :
              <CreateCheckpointDiscussion
                changeSetId={props.checkpointChangeSet}
              />
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckpointComponent;

const CreateCheckpointDiscussion = (props: {
  changeSetId: Pick<ChangeSet, "id">,
}) => {
  const [description, setDescription] = useState("");
  const [lix] = useAtom(lixAtom);

  const handleCreateCheckpoint = async () => {
    if (description !== "") {
      await createDiscussion({
        lix,
        changeSet: props.changeSetId,
        firstComment: { content: description },
      });
      await saveLixToOpfs({ lix });
    }
  };

  return (
    <div className="flex w-full gap-2 px-1 items-center">
      <Input
        className="flex-grow pl-2"
        placeholder="Write a comment"
        onInput={(event: any) => {
          event.preventDefault();
          setDescription(event.target?.value)
        }}
      ></Input>
      <Button
        onClick={handleCreateCheckpoint}
        size={"lg"}
      >
        Start discussion
      </Button>
    </div>
  );
};