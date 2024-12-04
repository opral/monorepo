import React, { useEffect, useState, JSX } from "react";
import { Change } from "@lix-js/sdk";
import IconChevron from "@/components/icons/IconChevron.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import timeAgo from "@/helper/timeAgo.ts";
import clsx from "clsx";
import { lixAtom } from "@/state.ts";
import { useAtom } from "jotai/react";
import ChangeDot from "./ChangeDot.tsx";
import { selectedChangeIdsAtom } from "@/state-active-file.ts";

export const ChangeComponent = (props: {
	change: Change & {
		snapshot_content: Record<string, any> | null;
		parent_snapshot_content: Record<string, any> | null;
		file_path: string; account_name: string
	};
	showTopLine: boolean;
	showBottomLine: boolean;
}) => {
	const [isExpandedState, setIsExpandedState] = useState<boolean>(false);
	const [lix] = useAtom(lixAtom);
	const [DiffComponent, setDiffComponent] = useState<JSX.Element | null>(null);
	const [selectedChangeIds, setSelectedChangeIds] = useAtom(selectedChangeIdsAtom);

	useEffect(() => {
		loadDiffComponent();
	}, [lix]);

	const loadDiffComponent = async () => {
		if (lix) {
			const schemaKey = props.change.schema_key;
			const plugin = (await lix.plugin.getAll()).find((p) =>
				p.diffUiComponents?.some((c) => c.schema_key === schemaKey)
			);
			const component = plugin?.diffUiComponents?.find((c) => c.schema_key === schemaKey)?.component;
			if (component) {
				// Dynamically define the custom element (if not already defined)
				if (!customElements.get(`diff-${schemaKey}`)) {
					customElements.define(`diff-${schemaKey}`, component.constructor as typeof HTMLElement);
				}

				setDiffComponent(() => {
					const WrappedComponent = (props: { snapshotBefore: Record<string, any> | null; snapshotAfter: Record<string, any> | null }) => {
						return React.createElement(`diff-${schemaKey}`, props);
					};

					return React.createElement(WrappedComponent, {
						snapshotBefore: props.change.parent_snapshot_content,
						snapshotAfter: props.change.snapshot_content,
					});
				});
			}
			// Todo: add fallback component
		}
	};

	const handleCheckboxClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		// add or remove the change id from the selectedChangeIdsAtom
		if (selectedChangeIds.includes(props.change.id)) {
			setSelectedChangeIds(selectedChangeIds.filter((id) => id !== props.change.id));
		} else {
			setSelectedChangeIds([...selectedChangeIds, props.change.id]);
		}
	};


	return (
		<div
			className="flex group hover:bg-slate-50 rounded-md cursor-pointer flex-shrink-0"
			onClick={() => setIsExpandedState(!isExpandedState)}
		>
			<ChangeDot top={props.showTopLine} bottom={props.showBottomLine} />
			<div className="flex-1">
				<div className="h-12 flex items-center w-full">
					<Checkbox className="mr-3" onClick={handleCheckboxClick} checked={selectedChangeIds.includes(props.change.id)} />
					<p className="flex-1 truncate text-ellipsis overflow-hidden">
						Change{" "}
						<span className="text-slate-500">
							{props.change.entity_id.split("|").length > 1
								? `cell: ${props.change.entity_id.split("|")[1]} - ${props.change.entity_id.split("|")[2]}`
								: props.change.entity_id}
						</span>
					</p>
					<div className="flex gap-2 items-center pr-2">
						<span className="text-sm font-medium text-slate-500 block pr-2">{timeAgo(props.change.created_at)}</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Avatar className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity">
										<AvatarImage src="#" alt="#" />
										<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
											{props.change.account_name ? props.change.account_name.substring(0, 2).toUpperCase() : "XX"}
										</AvatarFallback>
									</Avatar>
								</TooltipTrigger>
								<TooltipContent>{props.change.account_name}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<Button variant="ghost" size="icon">
							<IconChevron className={clsx(isExpandedState ? "rotate-180" : "rotate-0", "transition")} />
						</Button>
					</div>
				</div>
				{isExpandedState && (
					<div className="pb-2">
						<div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 pr-2 sm:pr-3 pt-2 pb-6 sm:pb-8 overflow-hidden">
							{DiffComponent && (<>{DiffComponent}</>)}
							{/* <pre>{JSON.stringify(props.change, null, 2)}</pre> */}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
