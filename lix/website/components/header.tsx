import IconDiscord from "./icons/discord";
import IconGitHub from "./icons/github";
import IconSubstack from "./icons/substack";

const Header = () => {
  return (
    <header>
      <div className="w-full max-w-2xl px-4 mx-auto my-8 flex items-center justify-end gap-4">
        <a
          href="https://github.com/opral/monorepo"
          target="_blanc"
          className="mt-2 w-fit text-[16px] px-4 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer flex items-center gap-2 no-underline"
        >
          <IconGitHub />
          GitHub
        </a>
        <a
          href="https://discord.gg/gdMPPWy57R"
          target="_blanc"
          className="mt-2 w-fit text-[16px] px-4 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer flex items-center gap-2 no-underline"
        >
          <IconDiscord />
          Discord
        </a>
        <a
          href="https://opral.substack.com/"
          target="_blanc"
          className="mt-2 w-fit text-[16px] px-4 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer flex items-center gap-2 no-underline"
        >
          <IconSubstack />
          Blog
        </a>
      </div>
    </header>
  );
}

export default Header;