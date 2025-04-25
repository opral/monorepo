import { fileIdSearchParamsAtom, lixAtom } from "@/state.ts";
import IconArrowRight from "./icons/IconArrowRight.tsx"
import IconDiscussion from "./icons/IconDiscussion.tsx"
import { useAtom } from "jotai/react";
import { useEffect, useState } from "react";
import timeAgo from "@/helper/timeAgo.ts";
import CustomLink from "./CustomLink.tsx";

const DiscussionPreview = ({ discussionId }: { discussionId: string }) => {
  const [lix] = useAtom(lixAtom);
  const [firstComment, setFirstComment] = useState<{ id: string, content: string, created_at: string, author_name: string } | undefined>(undefined);
  const [fileId] = useAtom(fileIdSearchParamsAtom);

  useEffect(() => {
    getFirstComment(discussionId);
  }, [discussionId]);

  const getFirstComment = async (discussionId: string) => {
    const comment = await lix.db
			.selectFrom("comment")
			.innerJoin("change", (join) =>
				join
					.onRef("change.entity_id", "=", "comment.id")
					.on("change.schema_key", "=", "lix_comment_table")
			)
			.innerJoin("change_author", "change_author.change_id", "change.id")
			.innerJoin("account", "account.id", "change_author.account_id")
			.select([
				"comment.id",
				"comment.content",
				"change.created_at",
				"account.name as author_name",
			])
			.where("comment.discussion_id", "=", discussionId)
			.orderBy("change.created_at", "asc")
			.limit(1)
			.executeTakeFirstOrThrow();

    setFirstComment(comment);
  };

  return (
    <CustomLink to={`?f=${fileId}&t=${discussionId}`}>
      <div className="group/preview flex items-start gap-4 pl-3 pr-1.5 py-2 ring-1 ring-muted transition-all hover:ring-slate-500 rounded-sm bg-background">
        <IconDiscussion />
        <div className="flex-1">
          {firstComment && (
            <>
              <span className="font-medium">{firstComment.author_name}, {timeAgo(firstComment.created_at).toLocaleString()}</span>
              <p className="text-slate-500">{firstComment.content}</p>
            </>
          )}
        </div>
        <div className="transition-transform group-hover/preview:translate-x-1">
          <IconArrowRight />
        </div>
      </div >
    </CustomLink>
  )
}

export default DiscussionPreview
