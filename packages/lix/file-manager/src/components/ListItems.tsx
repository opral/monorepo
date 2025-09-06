import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import IconFile from "@/components/icons/IconFile.tsx";
import clsx from "clsx";
import IconMeatball from "@/components/icons/IconMeatball.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useState } from "react";
import { lixAtom } from "@/state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import CustomLink from "./CustomLink.tsx";

interface ListItemsProps {
	id: string;
	type: "file" | "automation";
	name: string;
	appLink?: string;
}

const ListItems = ({ id, type, name, appLink }: ListItemsProps) => {
	//hooks
	const [searchParams, setSearchParams] = useSearchParams();

	//local state
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const navigate = useNavigate();

	// global state
	const [lix] = useAtom(lixAtom);

	//functions
	const handleSelectFile = () => {
		const newSearchParams = new URLSearchParams(searchParams);
		newSearchParams.set("f", id);
		setSearchParams(newSearchParams);
	};

	const handleDeleteFile = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		await lix.db.deleteFrom("file").where("id", "=", id).execute();
		await saveLixToOpfs({ lix });
		const lixId = searchParams.get("lix");
		return navigate(`/?lix=${lixId}`);
	};

	const handleDownload = async () => {
		const file = await lix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirstOrThrow();

		const blob = new Blob([file.data as Uint8Array<ArrayBuffer>]);

		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		// remove prefixed root slash `/`
		a.download = file.path.slice(1);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleOverrideFile = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await lix.db
					.updateTable("file")
					.set("data", new Uint8Array(await file.arrayBuffer()))
					.where("id", "=", id)
					.returningAll()
					.execute();

				await saveLixToOpfs({ lix });
			}
		};
		input.click();
	};

	return (
		<div
			className={clsx(
				"group flex items-center mx-2 h-9 px-2 hover:bg-slate-50 cursor-pointer rounded-md",
				searchParams.get("f") === id ? "bg-slate-100 hover:bg-slate-100" : ""
			)}
			onClick={() => handleSelectFile()}
		>
			<div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500">
				<IconFile />
			</div>
			<div className="min-w-0 flex-1 ml-2">
				<p className="text-md truncate" title={name}>
					{name}
				</p>
			</div>
			{type === "file" && (
				<div
					className={clsx(
						"flex opacity-0 transition-opacity group-hover:opacity-100",
						dropdownOpen ? "opacity-100" : ""
					)}
				>
					<Button variant="ghost">
						<CustomLink to={appLink || ""}>Open</CustomLink>
					</Button>
					<DropdownMenu
						onOpenChange={(e) =>
							e ? setDropdownOpen(true) : setDropdownOpen(false)
						}
					>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<IconMeatball />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => handleDownload()}>
								Download
							</DropdownMenuItem>
							<DropdownMenuItem onClick={(e: any) => handleDeleteFile(e)}>
								Delete
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleOverrideFile()}>
								Override
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);
};

export default ListItems;
