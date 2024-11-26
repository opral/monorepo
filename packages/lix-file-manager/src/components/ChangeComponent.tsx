import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar.tsx";
import { Change } from "@lix-js/sdk";
import ChangeDot from "./ChangeDot.tsx";
import IconChevron from "./icons/IconChevron.tsx";
import { Button } from "./../../components/ui/button.tsx";
import timeAgo from "./../helper/timeAgo.ts";
import clsx from "clsx";

export const ChangeComponent = (props: {change: Change & {snapshot_content: Record<string, any> | null, file_path: string, account_id: string}, showTopLine: boolean, showBottomLine: boolean }) => {
	const [isExpandedState, setIsExpandedState] = useState<boolean>(false);

	return (
		<div
			className="flex group hover:bg-slate-50 rounded-md cursor-pointer"
			onClick={() => isExpandedState ? setIsExpandedState(false) : setIsExpandedState(true)}
		>
			<ChangeDot top={props.showTopLine} bottom={props.showBottomLine} />
			<div className="flex-1">
				<div className="h-12 flex items-center w-full">
					<div className="flex-1">
						Change <span className="text-slate-500">{
							// TODO: this is hardcoded, we might want a more uniformed way to do this (but context is too important)
							clsx(
								props.change.entity_id.split("|").length > 1 
									? `cell: ${props.change.entity_id.split("|")[1]} - ${props.change.entity_id.split("|")[2]}` 
									: props.change.entity_id
							)
						}</span>
					</div>
					<div className="flex gap-2 items-center pr-2">
						<span className="text-sm font-medium text-slate-500 block pr-2">
							{timeAgo(props.change.created_at)}
						</span>
						<Avatar
							className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity"
						>
							<AvatarImage src="#" alt="#" />
							<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
								{props.change.account_id
									? props.change.account_id.substring(0, 2).toUpperCase()
									: "XX"}
							</AvatarFallback>
						</Avatar>
						<Button variant="ghost" size="icon">
							<IconChevron className={clsx(isExpandedState ? "rotate-180" : "rotate-0", "transition")}/>
						</Button>
					</div>
				</div>
				{isExpandedState && <div className="pb-2">
					<div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 px-2 sm:px-3 pt-2 pb-6 sm:pb-8 overflow-hidden">
						<pre className="w-[400px]">{JSON.stringify(props.change, null, 2)}</pre>
					</div>
				</div>}
			</div>
		</div>
	);
};
