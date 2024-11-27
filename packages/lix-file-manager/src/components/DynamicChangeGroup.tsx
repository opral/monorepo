import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar.tsx";
import { Change } from "@lix-js/sdk";
import timeAgo from "./../helper/timeAgo.ts";
import { Button } from "./../../components/ui/button.tsx";
import { useSearchParams } from "react-router-dom";
import ChangeGroupDot from "./ChangeGroupDot.tsx";

export const DynamicChangeGroup = (props: {changes: (Change & {snapshot_content: Record<string, any> | null, file_path: string, account_name: string})[], showTopLine: boolean, showBottomLine: boolean }) => {
    const [, setSearchParams] = useSearchParams();

    const handlePathClicked = (file_id: string) => {
        setSearchParams({f: file_id})
    }

    const getUniqueFiles = (changes: (Change & {snapshot_content: Record<string, any> | null, file_path: string, account_name: string})[]): {file_path: string, file_id: string}[] => {
        const uniqueFiles = changes.reduce((acc: {file_path: string, file_id: string}[], change) => {
            if (!acc.find((file) => file.file_id === change.file_id)) {
                acc.push({file_path: change.file_path, file_id: change.file_id})
            }
            return acc;
        }, [])
        return uniqueFiles;
    }
    
    return (
		<div
			className="flex"
		>
			<ChangeGroupDot top={props.showTopLine} bottom={props.showBottomLine} />
			<div className="flex-1">
				<div className="h-[68px] flex items-center w-full">
					<div className="flex-1 flex flex-col">
                        <div>
                            {getUniqueFiles(props.changes).map((change) => 
                                <Button key={change.file_id} onClick={() => handlePathClicked(change.file_id)} variant="secondary" size="sm" className="w-fit">{change.file_path}</Button>
                            )}
                        </div>
                        
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
								{props.changes[0].account_name
									? props.changes[0].account_name.substring(0, 2).toUpperCase()
									: "XX"}
							</AvatarFallback>
						</Avatar>
					</div>
				</div>
			</div>
		</div>
	);
};
