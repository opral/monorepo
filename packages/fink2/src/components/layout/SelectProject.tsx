import { SlDropdown, SlMenu, SlMenuItem } from "@shoelace-style/shoelace/dist/react";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { selectedProjectPathAtom } from "../../state.ts";

const SelectProject = () => {
  const [selectedProjectPath, setSelectedProjectPath] = useAtom(
    selectedProjectPathAtom
  );
  const [existingProjects, setExistingProjects] = useState<string[]>([]);

  const getProjects = async () => {
    const projects: string[] = [];
    const opfsRoot = await navigator.storage.getDirectory();
    // @ts-expect-error - TS doesn't know about the keys method
    for await (const name of opfsRoot.keys()) {
      if (name.endsWith(".inlang")) {
        projects.push(name);
      }
    }
    return projects;
  };

  const handleSetExistingProjects = async () => {
    setExistingProjects(await getProjects());
  };

  useEffect(() => {
    handleSetExistingProjects();
  }, [selectedProjectPath]);

  return (
    <div className="flex items-center gap-1">
      {selectedProjectPath ? (
        <>
          <p className="text-[16px]">
            {selectedProjectPath?.replace(".inlang", "")}
          </p>
          <SlDropdown
            onSlShow={async () => {
              const projects = await getProjects();
              setExistingProjects(projects);
            }}
            placement="bottom-end"
            distance={4}
          >
            <div
              slot="trigger"
              className="h-8 px-1 hover:bg-zinc-100 flex justify-center items-center rounded-lg text-zinc-500 hover:text-zinc-950 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="m6 9.657l1.414 1.414l4.243-4.243l4.243 4.243l1.414-1.414L11.657 4zm0 4.786l1.414-1.414l4.243 4.243l4.243-4.243l1.414 1.414l-5.657 5.657z"
                />
              </svg>
            </div>
            <SlMenu>
              {existingProjects.map((name, index) => (
                <SlMenuItem key={index}>
                  <p
                    className="py-2"
                    onClick={() => setSelectedProjectPath(name)}
                  >
                    {name}
                  </p>
                </SlMenuItem>
              ))}
            </SlMenu>
          </SlDropdown>
        </>
      ) : (
        <p className="text-[16px]">no project</p>
      )}
    </div>
  );
};

export default SelectProject;