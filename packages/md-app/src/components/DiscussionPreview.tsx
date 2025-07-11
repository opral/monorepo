import { useQuery } from "@/hooks/useQuery";
import { useEffect, useState } from "react";
import timeAgo from "@/helper/timeAgo.ts";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { toPlainText } from "@lix-js/sdk/zettel-ast";
import { State, ThreadComment } from "@lix-js/sdk";
import { useLix } from "@lix-js/react-utils";

const DiscussionPreview = ({ threadId }: { threadId: string }) => {
	const lix = useLix();
	const [firstComment, setFirstComment] = useState<
		State<ThreadComment & { author_name: string }> | undefined
	>(undefined);
	const [fileId] = useQuery(() => {
		const searchParams = new URL(window.location.href).searchParams;
		return Promise.resolve(searchParams.get("f") || undefined);
	}, 100);

	useEffect(() => {
		getFirstComment(threadId);
	}, [threadId, lix]);

	const getFirstComment = async (threadId: string) => {
		if (!lix) return; // Don't try to query if lix is not ready
		
		const comment = await lix.db
			.selectFrom("thread_comment")
			.innerJoin("change", (join) =>
				join
					.onRef("change.entity_id", "=", "thread_comment.id")
					.on("change.schema_key", "=", "lix_comment_table")
			)
			.innerJoin("change_author", "change_author.change_id", "change.id")
			.innerJoin("account", "account.id", "change_author.account_id")
			.selectAll("thread_comment")
			.select(["account.name as author_name"])
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
							<span className="font-medium">
								{firstComment.author_name},{" "}
								{timeAgo(firstComment.lixcol_created_at).toLocaleString()}
							</span>
							<p className="text-slate-500">{toPlainText(firstComment.body)}</p>
						</>
					)}
				</div>
				<div className="transition-transform group-hover/preview:translate-x-1">
					<ArrowRight />
				</div>
			</div>
		</Link>
	);
};

export default DiscussionPreview
