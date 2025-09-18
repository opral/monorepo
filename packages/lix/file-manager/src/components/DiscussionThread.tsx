import { useAtom } from "jotai/react";
import timeAgo from "@/helper/timeAgo.ts";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar.tsx";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip.tsx";
import { activeConversationAtom } from "@/state-active-file.ts";

const DiscussionThread = () => {
  const [activeThread] = useAtom(activeConversationAtom);

  return (
    <div>
      {activeThread?.comments &&
      // @ts-expect-error - comments is a stringified JSON
        JSON.parse(activeThread?.comments)
          .map((comment: {
            id: string;
            created_at: string;
            content: string;
            account_id: string;
            account_name: string;
          }) => (
            <div key={comment.id} className="flex items-start gap-3 mb-6 overflow-y-auto pl-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src="#" alt="#" />
                      <AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
                        {comment.account_name ? comment.account_name.substring(0, 2).toUpperCase() : "XX"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{comment.account_name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div>
                <div className="flex flex-1 gap-3 py-1 mb-1.5">
                  <span className="font-medium">{comment.account_name}</span>
                  <span className="text-slate-500">{timeAgo(comment.created_at)}</span>
                </div>
                <p>{comment.content}</p>
              </div>
            </div>
          ))}
    </div>
  )
}

export default DiscussionThread
