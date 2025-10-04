import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import ChangeDot from "./ChangeDot.tsx";
import IconChevron from "@/components/icons/IconChevron.tsx";
import clsx from "clsx";
import {
	checkpointChangeSetsAtom,
	intermediateChangesAtom,
} from "@/state-active-file.ts";
import { useAtom } from "jotai/react";
import { Input } from "./ui/input.tsx";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import { createCheckpoint, createConversation, type RenderDiffArgs } from "@lix-js/sdk";
import { lixAtom } from "@/state.ts";
import { ChangeDiffComponent } from "./ChangeDiffComponent.tsx";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";

export const IntermediateCheckpointComponent = () => {
	const [isExpandedState, setIsExpandedState] = useState<boolean>(true);
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);

	// Don't render anything if there's no change data
	if (intermediateChanges.length === 0) {
		return null;
	}

	// Group changes by plugin_key
	const groupedChanges = intermediateChanges.reduce(
		(acc: { [key: string]: RenderDiffArgs["diffs"] }, change) => {
			const key = change.plugin_key;
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(change);
			return acc;
		},
		{}
	);

	return (
		<div
			className="flex group hover:bg-slate-50 rounded-md cursor-pointer flex-shrink-0 pr-2"
			onClick={(e) => {
				if ((e.target as HTMLElement).tagName !== "INPUT") {
					e.stopPropagation();
					setIsExpandedState(!isExpandedState);
				}
			}}
		>
			<ChangeDot
				top={false}
				bottom={checkpointChangeSets.length > 0}
				highlighted
			/>
			<div className="flex-1 z-10">
				<div className="h-12 flex items-center w-full gap-2">
					<p className="flex-1 truncate text-ellipsis overflow-hidden">
						Intermediate changes{" "}
					</p>
					<div className="flex gap-3 items-center">
						<Button variant="ghost" size="icon">
							<IconChevron
								className={clsx(
									isExpandedState ? "rotate-180" : "rotate-0",
									"transition"
								)}
							/>
						</Button>
					</div>
				</div>
				{isExpandedState && (
					<div className="flex flex-col gap-2 pb-2">
						<div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 pt-2 pb-4 sm:pb-6 overflow-hidden">
							<CreateCheckpointInput />
							{Object.keys(groupedChanges).map((pluginKey) => (
								<ChangeDiffComponent
									key={pluginKey}
									diffs={groupedChanges[pluginKey]}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default IntermediateCheckpointComponent;

const CreateCheckpointInput = () => {
	const [description, setDescription] = useState("");
	const [lix] = useAtom(lixAtom);

	const handleCreateCheckpoint = async () => {
		if (!description) return;

		await lix.db.transaction().execute(async (trx) => {
			// Create the checkpoint first to get the commit ID
			const checkpoint = await createCheckpoint({ lix: { ...lix, db: trx } });

			// Now create the conversation and attach it to the commit
			await createConversation({
				lix: { ...lix, db: trx },
				comments: [{ body: fromPlainText(description!) }],
				entity: checkpoint,
			});
		});

		await saveLixToOpfs({ lix });
	};

	// Handle key down in the comment textarea
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleCreateCheckpoint();
		}
	};

	return (
		<div className="flex flex-col w-full gap-2 px-1 items-end">
			{/* {currentChangeSet?.id} */}
			<Input
				className="flex-grow pl-2 bg-background text-sm placeholder:text-sm"
				placeholder="Describe the changes"
				onChange={(event) => setDescription(event.target.value)}
				onKeyDown={handleKeyDown}
				value={description}
			></Input>
			<Button onClick={handleCreateCheckpoint}>Create checkpoint</Button>
		</div>
	);
};
