import { useSearchParams } from "react-router-dom";
import { Button } from "./../../components/ui/button.tsx";
import IconAutomation from "./icons/IconAutomation.tsx";
import IconFile from "./icons/IconFile.tsx";
import clsx from "clsx";
import IconMeatball from "./icons/IconMeatball.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./../../components/ui/dropdown-menu.tsx";
import { useState } from "react";
import { lixAtom } from "./../state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "./../helper/saveLixToOpfs.ts";

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

  // global state
  const [lix] = useAtom(lixAtom);

  //functions
  const handleSelectFile = () => {
    setSearchParams({f: id});
  }

  const handleDeleteFile = async () => {
		await lix.db.deleteFrom("file").where("id", "=", id).execute();
    await saveLixToOpfs({ lix });
	};

	const handleDownload = async () => {
		const file = await lix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirstOrThrow();

		const blob = new Blob([file.data]);

		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		// remove prefixed root slash `/`
		a.download = file.path.slice(1);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

  return (
    <div onClick={() => handleSelectFile()} className={clsx(
        searchParams.get("f") === id ? "bg-slate-100" : "",
      "group flex items-center justify-between mx-2.5 h-12 px-2.5 py-3 rounded-md hover:bg-slate-50 cursor-pointer"
      )}>
      <div className="flex gap-3">
        {type === "file" ? (
          <IconFile />
        ) : (
          <IconAutomation />
        )}
        {name}
      </div>
      {type === "file" && (
        <div className={clsx("flex opacity-0 transition-opacity group-hover:opacity-100", dropdownOpen ? "opacity-100" : "")}>
          <a href={appLink}>
            <Button variant="ghost">
              Open
            </Button>
          </a>
          <DropdownMenu onOpenChange={(e) => e ? setDropdownOpen(true) : setDropdownOpen(false)}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconMeatball />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload()}>Download</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteFile()}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

export default ListItems;