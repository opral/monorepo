import { cn } from "@/lib/utils.ts";
import IconGroup from "@/components/icons/IconGroup.tsx";

interface ChangeGroupDotProps {
  top?: boolean;
  bottom?: boolean;
}

const ChangeGroupDot = ({ top, bottom }: ChangeGroupDotProps) => {
  return (
    <div className="flex flex-col justify-center items-center w-10 h-auto relative gap-0.5">
      <div className={(cn("h-[10px] w-0.5", top && "bg-slate-200"))} />
      <IconGroup />
      <div className={(cn("flex-grow w-0.5", bottom && "bg-slate-200"))} />
    </div>
  )
}

export default ChangeGroupDot;
