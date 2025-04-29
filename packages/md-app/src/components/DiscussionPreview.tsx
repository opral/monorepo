import { fileIdSearchParamsAtom, lixAtom } from "@/state.ts";
import { useAtom } from "jotai/react";
import { useEffect, useState } from "react";
import timeAgo from "@/helper/timeAgo.ts";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { ThreadComment } from "@lix-js/sdk";
import { toPlainText } from "@lix-js/sdk/zettel-ast";

const DiscussionPreview = ({ threadId }: { threadId: string }) => {
  const [lix] = useAtom(lixAtom);
  const [firstComment, setFirstComment] = useState<ThreadComment & {
    author_name: string;
    created_at: string;
  } | undefined>(undefined);
  const [fileId] = useAtom(fileIdSearchParamsAtom);

  useEffect(() => {
    getFirstComment(threadId);
  }, [threadId]);

  const getFirstComment = async (threadId: string) => {
    const comment = await lix.db
      .selectFrom("thread_comment")
      .innerJoin("change", (join) =>
        join
          .onRef("change.entity_id", "=", "thread_comment.id")
          .on("change.schema_key", "=", "lix_comment_table")
      )
      .innerJoin("change_author", "change_author.change_id", "change.id")
      .innerJoin("account", "account.id", "change_author.account_id")
      .select([
        "thread_comment.id",
        "thread_comment.thread_id",
        "thread_comment.parent_id",
        "thread_comment.body",
        "change.created_at",
        "account.name as author_name",
      ])
      .where("thread_comment.thread_id", "=", threadId)
      .orderBy("change.created_at", "asc")
      .limit(1)
      .executeTakeFirstOrThrow();

    setFirstComment(comment);
  };

  return (
    <Link to={`?f=${fileId}&t=${threadId}`}>
      <div className="group/preview flex items-start gap-4 pl-3 pr-1.5 py-2 ring-1 ring-muted transition-all hover:ring-slate-500 rounded-sm bg-background">
        <MessagesSquare />
        <div className="flex-1">
          {firstComment && (
            <>
              <span className="font-medium">{firstComment.author_name}, {timeAgo(firstComment.created_at).toLocaleString()}</span>
              <p className="text-slate-500">{toPlainText(firstComment.body)}</p>
            </>
          )}
        </div>
        <div className="transition-transform group-hover/preview:translate-x-1">
          <ArrowRight />
        </div>
      </div >
    </Link>
  )
}

export default DiscussionPreview
