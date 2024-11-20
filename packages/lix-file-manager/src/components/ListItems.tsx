import { useSearchParams } from "react-router-dom";
import { Button } from "./../../components/ui/button.tsx";
import IconArrowRight from "./icons/IconArrowRight.tsx";
import IconAutomation from "./icons/IconAutomation.tsx";
import IconFile from "./icons/IconFile.tsx";
import clsx from "clsx";
import IconMeatball from "./icons/IconMeatball.tsx";

interface ListItemsProps {
  id: string;
  type: "file" | "automation";
  name: string;
  appLink?: string;
}

const ListItems = ({ id, type, name, appLink }: ListItemsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSelectFile = () => {
    setSearchParams({f: id});
  }

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
        <div className="flex">
          <a className="opacity-0 transition-opacity group-hover:opacity-100" href={appLink}>
            <Button variant="ghost">
              Open
            </Button>
          </a>
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon">
              <IconMeatball />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListItems;