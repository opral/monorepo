import { loadProjectInMemory, merge } from "@inlang/sdk2";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { forceReloadProjectAtom, projectAtom, selectedProjectPathAtom } from "../../state.ts";

const MergeButton = () => {
  const [project] = useAtom(projectAtom);
  const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
  const [, setForceReloadProject] = useAtom(forceReloadProjectAtom);

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".inlang";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const blob = new Blob([reader.result as ArrayBuffer]);
          const incoming = await loadProjectInMemory({ blob });
          // TODO remove workaround for https://github.com/opral/lix-sdk/issues/47
          const opfsRoot = await navigator.storage.getDirectory();
          const fileHandle = await opfsRoot.getFileHandle(
            selectedProjectPath!,
            {
              create: true,
            }
          );
          const writable = await fileHandle.createWritable();
          await merge({
            sourceLix: incoming.lix,
            targetLix: project!.lix,
          });
          const mergedBlob = await project!.toBlob();
          await writable.write(mergedBlob);
          await writable.close();
          setForceReloadProject(Date.now());
        };

        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  return (
    <SlButton
      disabled={project === undefined}
      slot="trigger"
      size="small"
      variant="default"
      onClick={() => handleImport()}
    >
      <div className="text-[13px]! h-full aspect-squere flex items-center justify-center -mx-[3px] -ml-[4px] gap-[5px]">
        <svg
          width="20"
          viewBox="0 0 18 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.1925 2.75L14.25 3.8075L10.6275 7.43C10.065 7.9925 9.75 8.7575 9.75 9.5525V13.3775L10.9425 12.1925L12 13.25L9 16.25L6 13.25L7.0575 12.1925L8.25 13.3775V9.5525C8.25 8.7575 7.935 7.9925 7.3725 7.43L3.75 3.8075L4.8075 2.75L9 6.9425L13.1925 2.75Z"
            fill="currentColor"
          />
        </svg>
        Merge
      </div>
    </SlButton>
  );
};

export default MergeButton;