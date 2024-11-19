import { Button } from "./Button.tsx";

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
            <svg
              xmlns="http://www.w3.org/
              2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 8.293a1 1 0 011.414 0L12 11.586V7a1 1 0 112 0v5a1 1 0 01-1 1H7a1 1 0 010-2h3.586l-3.293-3.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        )}
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default SectionHeader