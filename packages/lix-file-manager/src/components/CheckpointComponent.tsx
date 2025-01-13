import { useState } from "react";
import IconChevron from "@/components/icons/IconChevron.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import timeAgo from "@/helper/timeAgo.ts";
import clsx from "clsx";
import ChangeDot from "./ChangeDot.tsx";
import DiscussionPreview from "./DiscussionPreview.tsx";
import { Change, changeInVersion, Lix, Snapshot, sql, Version } from "@lix-js/sdk";
import { useAtom } from "jotai/react";
import { currentVersionAtom, lixAtom } from "@/state.ts";
import { ChangeDiffComponent } from "./ChangeDiffComponent.tsx";

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [changes, setChanges] = useState<Change[]>([]);

  // Don't render anything if there's no change data
  if (!props.checkpointChangeSet || !props.checkpointChangeSet.id) {
    return null;
  }

  const toggleExpanded = async () => {
    if (changes && changes.length > 0) setIsExpanded(!isExpanded);
    else {
      const changes = await getChanges(lix, props.checkpointChangeSet.id, currentVersion!);
      setChanges(changes);
      setIsExpanded(!isExpanded);
    }
  }

  return (
    <div
      className="flex group hover:bg-slate-50 rounded-md cursor-pointer flex-shrink-0 pr-2"
      onClick={(e) => {
        e.stopPropagation();
        toggleExpanded();
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
              <IconChevron
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
              {/* list change diffs */}
              {changes.map((change) => (
                <div key={change.id} className="flex flex-col gap-2">
                  <ChangeDiffComponent
                    key={change.id}
                    change={change}
                  />
                </div>
              ))}
            </div>
            {props.checkpointChangeSet.discussion_id && (
              <DiscussionPreview
                key={props.checkpointChangeSet.discussion_id}
                discussionId={props.checkpointChangeSet.discussion_id}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckpointComponent;

const getChanges = async (
  lix: Lix,
  changeSetId: string,
  // fileId: string,
  currentVersion: Version
): Promise<
  Array<
    Change & {
      snapshot_content: Snapshot["content"];
      parent_snapshot_content: Snapshot["content"] | null;
    }
  >
> => {
  const changes = await lix.db
    .selectFrom("change")
    .innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
    .innerJoin(
      "change_set_element",
      "change_set_element.change_id",
      "change.id"
    )
    .leftJoin("change_edge", "change_edge.child_id", "change.id")
    .leftJoin(
      "change as parent_change",
      "parent_change.id",
      "change_edge.parent_id"
    )
    .leftJoin(
      "snapshot as parent_snapshot",
      "parent_snapshot.id",
      "parent_change.snapshot_id"
    )
    .where("change_set_element.change_set_id", "=", changeSetId)
    .where(changeInVersion(currentVersion))
    // .where("change.file_id", "=", fileId)
    .selectAll("change")
    .select(sql`json(snapshot.content)`.as("snapshot_content"))
    .select(sql`json(parent_snapshot.content)`.as("parent_snapshot_content")) // This will be NULL if no parent exists
    .groupBy("change.id")
    .orderBy("change.created_at", "desc")
    .execute();

  return changes.map(change => ({
    ...change,
    snapshot_content: change.snapshot_content as Record<string, any> | null,
    parent_snapshot_content: change.parent_snapshot_content as Record<string, any> | null,
  }));
};