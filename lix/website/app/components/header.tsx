import IconDiscord from "./icons/discord"
import IconGitHub from "./icons/github"
import IconLix from "./icons/lix"
import IconX from "./icons/x"

export const socialLinks = [
	{
		text: "GitHub",
		href: "https://github.com/opral/monorepo",
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
]

const Header = () => {
	return (
		<header className="w-full max-w-5xl px-4 py-3 mx-auto flex items-center justify-between gap-4">
			<div className="flex items-center gap-4">
				<a href="/">
					<IconLix />
				</a>
				{[
					{
						text: "File Manager",
						href: "/file-manager",
					},
					{
						text: "Blog",
						href: "https://opral.substack.com",
					},
				].map((link, index) => (
					<a
						key={index}
						className="px-2 py-1 font-medium text-slate-500 hover:text-cyan-600"
						href={link.href}
					>
						{link.text}
					</a>
				))}
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
	)
}

export default Header
