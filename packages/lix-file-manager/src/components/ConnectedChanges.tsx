import { useEffect, useState } from "react";
import IconChevron from "./icons/IconChevron.tsx";
import { useAtom } from "jotai/react";
import { Button } from "./ui/button.tsx";
import { clsx } from "clsx";
import {
	// activeVersionAtom,
	threadSearchParamsAtom,
	lixAtom
} from "@/state.ts";
// import { activeFileAtom, getChangeDiffs } from "@/state-active-file.ts";
import { UiDiffComponentProps } from "@lix-js/sdk";
import { ChangeDiffComponent } from "./ChangeDiffComponent.tsx";

const ConnectedChanges = () => {
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [threadSearchParams] = useAtom(threadSearchParamsAtom);
	const [lix] = useAtom(lixAtom);
	// const [activeVersion] = useAtom(activeVersionAtom);
	// const [activeFile] = useAtom(activeFileAtom);
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
		const discussionChangeSet = await lix.db
			.selectFrom("thread")
			.innerJoin("change_set", "change_set.id", "thread.id")
			.where("thread.id", "=", threadSearchParams)
			.select(["change_set.id"])
			.executeTakeFirstOrThrow();

		if (!discussionChangeSet) return [];

		const changes = [] as UiDiffComponentProps["diffs"];
		// await getChangeDiffs(lix, discussionChangeSet.id, activeVersion!, activeFile);
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