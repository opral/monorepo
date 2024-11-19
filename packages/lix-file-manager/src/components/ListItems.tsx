import { useSearchParams } from "react-router-dom";
import { Button } from "./../../components/ui/button.tsx";
import IconArrowRight from "./icons/IconArrowRight.tsx";
import IconAutomation from "./icons/IconAutomation.tsx";
import IconFile from "./icons/IconFile.tsx";
import clsx from "clsx";

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
      <a className="hidden group-hover:block" href={appLink}>
        <Button variant="ghost">
          Open in app
          <IconArrowRight />
        </Button>
      </a>
    </div>
  )
}

export default ListItems;