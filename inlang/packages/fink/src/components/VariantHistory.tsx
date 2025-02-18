import { useAtom } from "jotai";
import { authorNameAtom, projectAtom } from "../state.ts";
import { useEffect, useState } from "react";
import { InlangProject } from "@inlang/sdk";
import timeAgo from "../helper/timeAgo.ts";
import { Commit } from "@inlang/sdk";

const VariantHistory = (props: { variantId: string }) => {
	const [project] = useAtom(projectAtom);
	const [authenticatedUser] = useAtom(authorNameAtom);
	const [latestCommit, setLatestCommit] = useState<Commit | undefined>(undefined);

	// TODO UPDATE FINK
	// useEffect(() => {
	// 	if (!project) return;
	// 	queryLatestCommit(project, props.variantId).then((result) =>
	// 		setLatestCommit(result as unknown as Commit)
	// 	);
	// 	const interval = setInterval(async () => {
	// 		const result = await queryLatestCommit(project, props.variantId);
	// 		setLatestCommit(result as unknown as Commit);
	// 	}, 1000);
	// 	return () => clearInterval(interval);
	// }, []);

	return (
		<div className="flex items-center text-zinc-400 text-[14px]! font-normal">
			{latestCommit?.author && (
				<p>
					by {latestCommit?.author === authenticatedUser ? "You" : authenticatedUser},{" "}
					{timeAgo(latestCommit.created_at)}
				</p>
			)}
		</div>
	);
};

export default VariantHistory;

// TODO UPDATE FINK
// const queryLatestCommit = async (project: InlangProject, variantId: string) => {
// 	const result = await project.lix.db
// 		.selectFrom("change")
// 		.selectAll()
// 		.where("change.type", "=", "variant")
// 		.where("change.commit_id", "!=", "null")
// 		.where((eb) => eb.ref("value", "->>").key("id"), "=", variantId)
// 		.innerJoin("commit", "commit.id", "change.commit_id")
// 		.orderBy("commit.author desc")
// 		.orderBy("commit.created_at desc")
// 		.executeTakeFirst();

// 	return result;
// };
