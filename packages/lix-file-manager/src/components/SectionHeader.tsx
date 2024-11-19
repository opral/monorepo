import { Button } from "./Button.tsx";
import IconArrowLeft from "./icons/IconArrowLeft.tsx";

interface SectionHeaderProps {
  title: string;
  backaction?: () => void;
  children?: React.ReactNode;
}

const SectionHeader = ({ title, backaction, children }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        {backaction && (
          <Button variant="ghost" size="icon" onClick={backaction}>
            <IconArrowLeft />
          </Button>
        )}
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default SectionHeader