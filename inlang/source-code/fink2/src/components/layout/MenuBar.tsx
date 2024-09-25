import HelpMenu from "./HelpMenu.tsx";
import ProjectMenu from "./ProjectMenu.tsx";
import SelectProject from "./SelectProject.tsx";

const MenuBar = () => {
  return (
    <>
      <div className="relative flex gap-2 mb-4 pt-3 justify-between items-center">
        <div className="flex gap-4 items-center">
          <ProjectMenu />
          <span className="text-zinc-300 text-[16px]! -ml-1.5">{"/"}</span>
          <SelectProject />
        </div>

        <div className="flex gap-[4px]">
          <HelpMenu />
        </div>
      </div>
    </>
  );
};

export default MenuBar;