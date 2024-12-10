import { cn } from "@/lib/utils.ts";

interface ChangeDotProps {
  top?: boolean;
  bottom?: boolean;
}

const ChangeDot = ({ top, bottom }: ChangeDotProps) => {
  return (
    <div className="flex flex-col justify-center items-center w-10 h-auto relative gap-0.5">
      <div className={(cn("h-[17px] w-0.5", top && "bg-slate-200"))} />
      <div className="flex-grow-0 flex-shrink-0 w-[7px] h-[7px] rounded bg-slate-700" />
      <div className={(cn("flex-grow w-0.5", bottom && "bg-slate-200"))} />
    </div>
  )
}

export default ChangeDot;