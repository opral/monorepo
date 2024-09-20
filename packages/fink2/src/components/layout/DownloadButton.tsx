import { handleDownload } from "../../helper/utils.ts";
import { projectAtom, selectedProjectPathAtom } from "../../state.ts";
import { useAtom } from "jotai";
import { SlButton } from "@shoelace-style/shoelace/dist/react";

const DownloadButton = () => {
  const [project] = useAtom(projectAtom);
  const [selectedProjectPath] = useAtom(selectedProjectPathAtom);

  return (
    <SlButton
      disabled={project === undefined}
      slot="trigger"
      size="small"
      variant="default"
      onClick={() => handleDownload(project, selectedProjectPath)}
    >
      <div className="text-[13px]! h-full aspect-squere flex items-center justify-center -mx-[3px] -ml-[4px] gap-[5px]">
        <svg
          width="20"
          viewBox="0 0 18 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 12.5L5.25 8.75L6.3 7.6625L8.25 9.6125V3.5H9.75V9.6125L11.7 7.6625L12.75 8.75L9 12.5ZM4.5 15.5C4.0875 15.5 3.7345 15.3533 3.441 15.0597C3.1475 14.7662 3.0005 14.413 3 14V11.75H4.5V14H13.5V11.75H15V14C15 14.4125 14.8533 14.7657 14.5597 15.0597C14.2662 15.3538 13.913 15.5005 13.5 15.5H4.5Z"
            fill="currentColor"
          />
        </svg>
        Download
      </div>
    </SlButton>
  );
};

export default DownloadButton;