import { SlDropdown, SlMenu, SlMenuItem } from "@shoelace-style/shoelace/dist/react";

const HelpMenu = () => {
	const getFinkResourcesLinks = () => {
		return [
			{
				name: "About Fink",
				href: import.meta.env.PROD
					? "https://inlang.com/m/tdozzpar"
					: "http://localhost:3000/m/tdozzpar",
			},
			{
				name: "About the ecosystem",
				href: import.meta.env.PROD
					? "https://inlang.com/documentation"
					: "http://localhost:3000/documentation",
			},
			{
				name: "Support Forum",
				href: "https://discord.gg/gdMPPWy57R",
			},
			{
				name: "Report a Bug",
				href: "https://github.com/opral/inlang-fink/issues/new",
			},
			{
				name: "Feature Request",
				href: "https://github.com/opral/inlang/discussions/categories/-fink-general",
			},
			{
				name: "Submit Feedback",
				href: "https://github.com/orgs/opral/discussions/categories/-fink-general",
			},
		];
	};

	return (
		<SlDropdown placement="bottom-end" className="peer">
			<button
				slot="trigger"
				className="h-8 px-2 flex justify-center items-center text-sm text-zinc-500 hover:text-zinc-950 cursor-pointer"
			>
				Need Help?
			</button>
			<SlMenu className="w-fit">
				{getFinkResourcesLinks().map((link) => (
					<div key={link.name}>
						<SlMenuItem>
							<a href={link.href} target="_blank">
								{link.name}
							</a>
						</SlMenuItem>
						{link.name === "About the ecosystem" && (
							<div className="w-full border-b border-zinc-200 my-1" />
						)}
					</div>
				))}
			</SlMenu>
		</SlDropdown>
	);
};

export default HelpMenu;
