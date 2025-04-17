import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/plate-ui/avatar.tsx";
import { Button } from "@/components/plate-ui/button.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/plate-ui/tooltip.tsx";
import { Input } from "@/components/plate-ui/input.tsx";
import timeAgo from "@/helper/timeAgo.ts";
import clsx from "clsx";
import ChangeDot from "./ChangeDot.tsx";
import { ChangeSet, createDiscussion, getBeforeAfterOfFile, UiDiffComponentProps } from "@lix-js/sdk";
import { useAtom } from "jotai/react";
import { lixAtom } from "@/state.ts";
import { ChangeDiffComponent } from "@/components/ChangeDiffComponent.tsx";
import { activeFileAtom, getChangeDiffs, getDiscussion } from "@/state-active-file.ts";
import { ChevronDown } from "lucide-react";

export const CheckpointComponent = (props: {
  checkpointChangeSet: {
    id: string;
    immutable_elements: boolean;
    change_count: number;
    created_at: string | null;
    author_name: string | null;
  }
  previousChangeSetId: string | null;
  showTopLine: boolean;
  showBottomLine: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [diffs, setDiffs] = useState<UiDiffComponentProps["diffs"]>([]);
  const [discussion, setDiscussion] = useState<any>(undefined);
  const [lix] = useAtom(lixAtom);
  const [activeFile] = useAtom(activeFileAtom);

  useEffect(() => {
    const fetchDiscussion = async () => {
      if (props.checkpointChangeSet.id) {
        const discussion = await getDiscussion(props.checkpointChangeSet.id);
        if (discussion) setDiscussion(discussion);
      }
    };

    fetchDiscussion();
  }, []);

  // Don't render anything if there's no change data
  if (!props.checkpointChangeSet || !props.checkpointChangeSet.id) {
    return null;
  }

  const toggleExpanded = () => {
    if (diffs.length > 0) {
      setIsExpanded(!isExpanded);
      return;
    }
    getChangeDiffs(props.checkpointChangeSet.id).then((diffs) => {
      setDiffs(diffs);
    });
    // TODO: diff needs to hanndle before and after file
    // getBeforeAfterOfFile({
    //   lix,
    //   changeSetBefore: props.previousChangeSetId ? { id: props.previousChangeSetId } : undefined,
    //   changeSetAfter: props.checkpointChangeSet.id ? { id: props.checkpointChangeSet.id } : undefined,
    //   file: { id: activeFile!.id },
    // }).then((diffs) => {
    //   setDiffs([diffs]);
    // });

    setIsExpanded(true);
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
        <div className="flex flex-col w-full mt-1.5">
          <div className="h-8 flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0 flex-shrink-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="w-6 h-6 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src="#" alt="#" />
                      <AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7] text-xs">
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
              <span className="font-medium text-sm truncate">
                {props.checkpointChangeSet.author_name}
              </span>
            </div>

            <div className="flex items-center flex-shrink-0">
              <span className="text-xs text-slate-500 mr-1">
                {timeAgo(props.checkpointChangeSet.created_at!)}
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown
                  className={clsx(
                    isExpanded ? "rotate-180" : "rotate-0",
                    "transition h-4 w-4"
                  )}
                />
              </Button>
            </div>
          </div>

          <div className="pb-2">
            <p className="text-sm text-slate-500 truncate text-ellipsis overflow-hidden pr-2">
              {discussion?.comments[0]?.content || "Create checkpoint"}
            </p>
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
                  contentClassName="text-sm" /* Set font size to 14px (text-sm in Tailwind) */
                // debug={true}
                />
              ))}
            </div>
            {/* {props.checkpointChangeSet.discussion_id ? (
              <DiscussionPreview
                key={props.checkpointChangeSet.discussion_id}
                discussionId={props.checkpointChangeSet.discussion_id}
              />
            ) :
              <CreateCheckpointDiscussion
                changeSetId={props.checkpointChangeSet}
              />
            } */}
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