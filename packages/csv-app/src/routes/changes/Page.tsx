import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import ChangeSet from "../../components/ChangeSet.tsx";
import { atom, useAtom } from "jotai";
import { lixAtom, withPollingAtom } from "../../state.ts";
import { activeFileAtom } from "../../state-active-file.ts";

const changeSetsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const activeFile = await get(activeFileAtom);
	return await lix.db
		.selectFrom("change_set")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_set_id",
			"change_set.id"
		)
		.leftJoin("change", "change.id", "change_set_element.change_id")
		.leftJoin("discussion", "discussion.change_set_id", "change_set.id")
		// Join with the `comment` table, filtering for first-level comments
		.leftJoin("comment", "comment.discussion_id", "discussion.id")
		.where("comment.parent_id", "is", null) // Filter to get only the first comment
		.where("change.file_id", "=", activeFile.id)
		.groupBy("change_set.id")
		.orderBy("change.created_at", "desc")
		.select("change_set.id")
		.select("discussion.id as discussion_id")
		.select("comment.content as first_comment_content") // Get the first comment's content
		.execute();
});

export default function Page() {
	const [changeSets] = useAtom(changeSetsAtom);
	return (
		<>
			<OpenFileLayout>
				<div className="px-3 pb-6 pt-3 md:pt-5">
					<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
						{changeSets.map((changeSet) => (
							<ChangeSet
								key={changeSet.id}
								id={changeSet.id}
								firstComment={changeSet.first_comment_content}
							/>
						))}
					</div>
				</div>
			</OpenFileLayout>
		</>
	);
}
