import { Link } from "@remix-run/react"
import IconDiscord from "./icons/discord"
import IconGitHub from "./icons/github"
import IconLix from "./icons/lix"
import IconX from "./icons/x"

export const socialLinks = [
  {
    text: "GitHub",
    href: "https://github.com/opral/lix-sdk",
    icon: <IconGitHub />,
  },
  {
    text: "Discord",
    href: "https://discord.gg/gdMPPWy57R",
    icon: <IconDiscord />,
  },
  {
    text: "Twitter",
    href: "https://x.com/lixCCS",
    icon: <IconX />,
  },
];

const Header = () => {
  return (
    <header className="w-full max-w-5xl px-4 py-3 mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link to="/">
          <div className="pr-4">
            <IconLix />
          </div>
        </Link>
        <Link
          className="md:px-1 py-1 text-slate-500 hover:text-cyan-600"
          target="_blank"
          to="https://github.com/opral/lix-sdk"
        >
          SDK Documentation
        </Link>
        <Link
          className="md:px-1 py-1 text-slate-500 hover:text-cyan-600"
          to="/file-manager"
        >
          File Manager
        </Link>
        <a
          className="md:px-1 py-1 text-slate-500 hover:text-cyan-600"
          target="_blank"
          href="https://opral.substack.com"
        >
          Blog
        </a>
      </div>
      <div className="flex items-center md:gap-3">
        {socialLinks.map((socialLink, index) => (
          <a
            key={index}
            className="p-2 text-slate-900 hover:text-cyan-600"
            href={socialLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {socialLink.icon}
          </a>
        ))}
      </div>
    </header>
  );
};

export default Header
