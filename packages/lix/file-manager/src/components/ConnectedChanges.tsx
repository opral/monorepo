import { useEffect, useState } from "react";
import IconChevron from "./icons/IconChevron.tsx";
import { useAtom } from "jotai/react";
import { Button } from "./ui/button.tsx";
import { clsx } from "clsx";
import { conversationSearchParamsAtom, lixAtom } from "@/state.ts";
import { activeFileAtom, getChangeDiffs } from "@/state-active-file.ts";
import { UiDiffComponentProps } from "@lix-js/sdk";
import { ChangeDiffComponent } from "./ChangeDiffComponent.tsx";

const ConnectedChanges = () => {
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [threadSearchParams] = useAtom(conversationSearchParamsAtom);
	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [diffs, setDiffs] = useState<UiDiffComponentProps["diffs"]>([]);

	useEffect(() => {
		getThreadChanges()
	}, []);

	// Group changes by plugin_key
	const groupedChanges = diffs.reduce((acc: { [key: string]: UiDiffComponentProps["diffs"] }, change) => {
		const key = change.plugin_key;
		if (!acc[key]) {
			acc[key] = [];
		}
		acc[key].push(change);
		return acc;
	}, {});

	const getThreadChanges = async () => {
		if (!threadSearchParams) return [];

		// Find the commit attached to this conversation
		const mapping = await lix.db
			.selectFrom("entity_conversation")
			.innerJoin("commit", "commit.id", "entity_conversation.entity_id")
			.where("entity_conversation.conversation_id", "=", threadSearchParams)
			.where("entity_conversation.schema_key", "=", "lix_commit")
			.where("entity_conversation.file_id", "=", "lix")
			.select(["commit.change_set_id"])
			.executeTakeFirst();

		if (!mapping) {
			setDiffs([]);
			return [];
		}

		const changes = await getChangeDiffs(
			lix,
			mapping.change_set_id,
			undefined,
			activeFile?.id ?? undefined
		);
		setDiffs(changes);
		return changes;
	};

	return (
		<div
			className="flex-shrink -mx-2.5 px-2.5 border-y-[1px] border-slate-200 hover:bg-slate-50"
			onClick={() => setIsExpanded(!isExpanded)}
		>
			<div className="group/connected flex items-center flex-1 py-1.5 pl-2.5 pr-2 rounded-md cursor-pointer">
				<div className="flex flex-1 gap-3">
					<span className="font-medium">{diffs.length}</span>
					<span className="text-slate-500">
						{diffs.length === 1
							? "related change"
							: "related changes"}
					</span>
				</div>
				<Button variant="ghost" size="icon">
					<IconChevron
						className={clsx(
							isExpanded ? "rotate-180" : "rotate-0",
							"transition"
						)}
					/>
				</Button>
			</div>
			{isExpanded && (
				<div className="flex flex-col pl-2 pb-4 w-full">
					{Object.keys(groupedChanges).map((pluginKey) => (
						<ChangeDiffComponent
							key={pluginKey}
							diffs={groupedChanges[pluginKey]}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default ConnectedChanges;
