import { cn } from "./../../lib/utils.ts";
import IconGroup from "./icons/IconGroup.tsx";

interface ChangeGroupDotProps {
  top?: boolean;
  bottom?: boolean;
}

const ChangeGroupDot = ({ top, bottom }: ChangeGroupDotProps) => {
  return (
    <div className="flex flex-col justify-center items-center w-6 h-[50px] relative gap-0.5">
      <div className={(cn("flex-grow w-0.5", top && "bg-slate-200"))} />
      <IconGroup />
      <div className={(cn("flex-grow w-0.5", bottom && "bg-slate-200"))} />
    </div>
  )
}

export default ChangeGroupDot;
