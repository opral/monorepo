import { Button } from "./Button.tsx";
import IconArrowRight from "./icons/IconArrowRight.tsx";
import IconAutomation from "./icons/IconAutomation.tsx";
import IconFile from "./icons/IconFile.tsx";

interface ListItemsProps {
  type: "file" | "automation";
  name: string;
  appLink?: string;
}

const ListItems = ({ type, name, appLink }: ListItemsProps) => {
  return (
    <div className="group flex items-center justify-between mx-2.5 h-12 px-2.5 py-3 rounded-md hover:bg-slate-50">
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