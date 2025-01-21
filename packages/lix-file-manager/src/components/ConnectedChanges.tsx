import { useState } from "react";
import IconChevron from "./icons/IconChevron.tsx";
import { useAtom } from "jotai/react";
import { changesCurrentVersionAtom } from "@/state-active-file.ts";
import { ChangeComponent } from "./ChangeComponent.tsx";
import { Button } from "./ui/button.tsx";
import { clsx } from "clsx";
import { discussionSearchParamsAtom } from "@/state.ts";

const ConnectedChanges = () => {
	const [isExpandedState, setIsExpandedState] = useState<boolean>(false);
	const [changesCurrentVersion] = useAtom(changesCurrentVersionAtom);
	const [discussionSearchParams] = useAtom(discussionSearchParamsAtom);
	const filteredChanges = changesCurrentVersion.filter((change) => {
		if (
			!change.discussion_ids ||
			typeof change.discussion_ids !== "string" ||
			!discussionSearchParams
		)
			return false;
		return change.discussion_ids.split(",").includes(discussionSearchParams);
	});

	return (
		<div
			className="flex-shrink -mx-2.5 px-2.5 border-y-[1px] border-slate-200 hover:bg-slate-50"
			onClick={() => setIsExpandedState(!isExpandedState)}
		>
			<div className="group/connected flex items-center flex-1 py-1.5 pl-2.5 pr-2 rounded-md cursor-pointer">
				<div className="flex flex-1 gap-3">
					<span className="font-medium">{filteredChanges.length}</span>
					<span className="text-slate-500">
						{filteredChanges.length === 1
							? "related change"
							: "related changes"}
					</span>
				</div>
				<Button variant="ghost" size="icon">
					<IconChevron
						className={clsx(
							isExpandedState ? "rotate-180" : "rotate-0",
							"transition"
						)}
					/>
				</Button>
			</div>
			{isExpandedState && (
				<div className="flex flex-col pb-2">
					{filteredChanges.map((change, i) => (
						<ChangeComponent
							key={change.id}
							change={{
								...change,
								snapshot_content_after:
									change.snapshot_content_after as Record<string, any> | null,
								snapshot_content_before:
									change.snapshot_content_before as Record<string, any> | null,
								discussion_count: Number(change.discussion_count),
								discussion_ids: String(change.discussion_ids || ""),
							}}
							showTopLine={i !== 0}
							showBottomLine={i !== changesCurrentVersion.length - 1}
							reduced
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default ConnectedChanges;