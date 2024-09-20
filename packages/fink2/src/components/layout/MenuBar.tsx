import AppMenu from "./AppMenu.tsx";
import DownloadButton from "./DownloadButton.tsx";
import HelpMenu from "./HelpMenu.tsx";
import MergeButton from "./MergeButton.tsx";
import SelectProject from "./SelectProject.tsx";

const MenuBar = () => {
  return (
    <>
      <div className="relative flex gap-2 mb-4 pt-3 justify-between items-center">
        <div className="flex gap-4 items-center">
          <AppMenu />
          <p className="text-zinc-300 text-[16px]!">{"/"}</p>
          <SelectProject />
        </div>

        <div className="flex gap-[4px]">
          <HelpMenu />
          <DownloadButton />
          <MergeButton />
        </div>
      </div>
    </>
  );
};

export default MenuBar;