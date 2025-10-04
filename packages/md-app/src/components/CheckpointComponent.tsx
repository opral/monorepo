import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import timeAgo from "@/helper/timeAgo.ts";
import clsx from "clsx";
import ChangeDot from "./ChangeDot.tsx";
import { UiDiffComponentProps, jsonArrayFrom } from "@lix-js/sdk";
import { toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import { ChangeDiffComponent } from "@/components/ChangeDiffComponent.tsx";
import { selectChangeDiffs } from "@/queries";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@lix-js/react-utils";

export const CheckpointComponent = (props: {
	checkpointChangeSet: {
		id: string;
		change_count: number;
		checkpoint_created_at: string | null;
		author_name: string | null;
	};
	previousChangeSetId: string | null;
	showTopLine: boolean;
	showBottomLine: boolean;
}) => {
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [shouldLoadDiffs, setShouldLoadDiffs] = useState<boolean>(false);
	
	// Get conversations by finding the commit for this change set and querying conversations for that commit
	const threads = useQuery(({ lix }) =>
		lix.db
			.selectFrom("conversation")
			.innerJoin(
				"entity_conversation",
				"conversation.id",
				"entity_conversation.conversation_id",
			)
			.innerJoin("commit", (join) =>
				join
					.onRef("commit.id", "=", "entity_conversation.entity_id")
					.on("entity_conversation.schema_key", "=", "lix_commit")
					.on("entity_conversation.file_id", "=", "lix")
			)
			.where("commit.change_set_id", "=", props.checkpointChangeSet.id)
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("conversation_message")
						.innerJoin(
							"change_author",
							"conversation_message.lixcol_change_id",
							"change_author.change_id",
						)
						.innerJoin("account", "account.id", "change_author.account_id")
						.select([
							"conversation_message.id",
							"conversation_message.body",
							"conversation_message.conversation_id",
							"conversation_message.parent_id",
							"conversation_message.lixcol_created_at",
							"conversation_message.lixcol_updated_at",
						])
						.select("account.name as author_name")
						.orderBy("conversation_message.lixcol_created_at", "asc")
						.whereRef(
							"conversation_message.conversation_id",
							"=",
							"conversation.id",
						)
				).as("comments"),
			])
			.selectAll("conversation")
	);
	
	const diffs = useQuery(({ lix }) =>
		selectChangeDiffs(lix, props.checkpointChangeSet.id, props.previousChangeSetId),
	);

	// Don't render anything if there's no change data
	if (!props.checkpointChangeSet || !props.checkpointChangeSet.id) {
		return null;
	}

	const toggleExpanded = () => {
		if (!isExpanded && !shouldLoadDiffs) {
			// Start loading diffs when expanding for the first time
			setShouldLoadDiffs(true);
		}
		setIsExpanded(!isExpanded);
	};

	// Group changes by plugin_key
	const groupedChanges = (diffs || []).reduce(
		(acc: { [key: string]: UiDiffComponentProps["diffs"] }, change) => {
			const key = change.plugin_key;
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(change);
			return acc;
		},
		{}
	);

	// Get the first comment if it exists
	const firstComment = threads?.[0]?.comments?.[0];

	// Truncate comment content if it's longer than 50 characters
	const truncatedComment = firstComment?.body
		? firstComment.body.content.length > 50
			? `${toPlainText(firstComment.body).substring(0, 50)}...`
			: toPlainText(firstComment.body)
		: null;

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
									<TooltipContent>
										{props.checkpointChangeSet.author_name}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<span className="font-medium text-sm truncate">
								{props.checkpointChangeSet.author_name}
							</span>
						</div>

						<div className="flex items-center flex-shrink-0">
							<span className="text-xs text-slate-500 mr-1">
								{timeAgo(props.checkpointChangeSet.checkpoint_created_at!)}
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
						<p className="text-sm text-slate-500 overflow-hidden pr-2 whitespace-normal">
							{truncatedComment || "Create checkpoint"}
						</p>
					</div>
				</div>
				{isExpanded && (
					<div className="flex flex-col gap-2 pb-2">
						{/* Option to introduce tabs - Threads | Changes */}
						<div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 pt-2 pb-4 sm:pb-6 overflow-hidden">
							{Object.keys(groupedChanges).map((pluginKey) => (
								<ChangeDiffComponent
									key={pluginKey}
									diffs={groupedChanges[pluginKey]}
									contentClassName="text-sm"
								// debug={true}
								/>
							))}
						</div>
						{/* {props.checkpointChangeSet.discussion_id ? (
              <DiscussionPreview
                key={props.checkpointChangeSet.discussion_id}
                threadId={props.checkpointChangeSet.discussion_id}
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

// const CreateCheckpointDiscussion = (props: {
//   changeSetId: Pick<ChangeSet, "id">,
// }) => {
//   const [description, setDescription] = useState("");
//   const [lix] = useAtom(lixAtom);

//   const handleCreateCheckpoint = async () => {
//     if (description !== "") {
//       await createDiscussion({
//         lix,
//         changeSet: props.changeSetId,
//         firstComment: { content: description },
//       });
//     }
//   };

//   return (
//     <div className="flex w-full gap-2 px-1 items-center">
//       <Input
//         className="flex-grow pl-2"
//         placeholder="Write a comment"
//         onInput={(event: any) => {
//           event.preventDefault();
//           setDescription(event.target?.value)
//         }}
//       ></Input>
//       <Button
//         onClick={handleCreateCheckpoint}
//         size={"lg"}
//       >
//         Start discussion
//       </Button>
//     </div>
//   );
// };
