import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar.tsx";
import { Account, Change } from "@lix-js/sdk";
import ChangeDot from "./ChangeDot.tsx";
import timeAgo from "./../helper/timeAgo.ts";
import { Button } from "./../../components/ui/button.tsx";
import { useSearchParams } from "react-router-dom";

export const DynamicChangeGroup = (props: {changes: (Change & {snapshot_content: Record<string, any> | null, file_path: string})[], authors: Account[], showTopLine: boolean, showBottomLine: boolean }) => {
    const [, setSearchParams] = useSearchParams();

    const handlePathClicked = (file_id: string) => {
        setSearchParams({f: file_id})
    }
    
    return (
		<div
			className="flex"
		>
			<ChangeDot top={props.showTopLine} bottom={props.showBottomLine} />
			<div className="flex-1">
				<div className="h-16 flex items-center w-full">
					<div className="flex-1 flex flex-col">
                        {props.changes.map((change) => 
                            <Button onClick={() => handlePathClicked(change.file_id)} variant="secondary" size="sm" className="w-fit">{change.file_path}</Button>
                        )}
						<p className="text-sm font-medium text-slate-500 px-2 pt-0.5">
                            {timeAgo(props.changes[0].created_at)}{" - "}{props.changes.length}{" changes"}
                        </p>
					</div>
					<div className="flex gap-2 items-center pr-2">
						<Avatar
							className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity"
						>
							<AvatarImage src="#" alt="#" />
							<AvatarFallback className="bg-[#fff] text-[#141A21] border border-[#DBDFE7]">
								{props.authors[0].name
									? props.authors[0].name.substring(0, 2).toUpperCase()
									: "XX"}
							</AvatarFallback>
						</Avatar>
					</div>
				</div>
			</div>
		</div>
	);
};
