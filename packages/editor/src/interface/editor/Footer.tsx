import { For, Show } from "solid-js"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"
import Link from "#src/renderer/Link.jsx"
import IconQuestionMark from "~icons/material-symbols/question-mark"
// import IconExpandMore from "~icons/material-symbols/expand-more"

const Footer = () => {
	const socialMediaLinks = [
		{
			name: "Twitter",
			href: "https://twitter.com/finkEditor",
			Icon: IconX,
			screenreader: "Twitter Profile",
		},
		{
			name: "GitHub",
			href: "https://github.com/opral/monorepo",
			Icon: IconGithub,
			screenreader: "GitHub Repository",
		},
		{
			name: "Discord",
			href: "https://discord.gg/gdMPPWy57R",
			Icon: IconDiscord,
			screenreader: "Discord Server",
		},
	]

	const getResourcesLinks = () => {
		return [
			{
				name: "About Fink",
				href: import.meta.env.PROD ? "https://inlang.com/m/tdozzpar" : "http://localhost:3000/m/tdozzpar",
			},
			{
				name: "User Guide",
				href: import.meta.env.PROD ? "https://inlang.com/g/6ddyhpoi" : "http://localhost:3000/g/6ddyhpoi",
			},
			{
				name: "About the ecosystem",
				href: import.meta.env.PROD ? "https://inlang.com/documentation" : "http://localhost:3000/documentation",
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
				href: "https://github.com/opral/monorepo/discussions/categories/-fink-general",
			},
			{
				name: "Submit Feedback",
				href: "https://github.com/orgs/opral/discussions/categories/-fink-general",
			},
			{
				name: "Contact Us",
				href: "mailto:hello@inlang.com",
			},
			{
				name: "Join the Team",
				href: "https://github.com/opral/monorepo/tree/main/careers",
			}
		]
	}

	return (
		<footer class="bg-background border-t border-surface-200 py-4 px-4 overflow-visible">
			<div class="max-w-7xl mx-auto flex justify-between gap-4 h-6">
				<div class="xl:pl-4 flex items-center justify-between">
					<p class="text-sm text-surface-500">
						© {new Date().getFullYear().toString()} Opral
					</p>
				</div>
				<div class="flex gap-4 mr-[67.21px]">
					<For each={socialMediaLinks}>
						{(link) => (
							<Link
								target="_blank"
								class={"link link-primary flex space-x-2 items-center text-xs"}
								href={link.href}
							>
								<link.Icon class="w-5 h-5 text-surface-900" />
								<span class="sr-only">{link.name}</span>
							</Link>
						)}
					</For>
				</div>
				<div class="relative xl:pr-4">
					<sl-dropdown
						prop:placement="top-end"
						prop:distance={4}
						class="peer"
					>
						<button slot="trigger" class="bg-surface-900 rounded-full p-1">
							<IconQuestionMark class="w-4 h-4 text-background" />
						</button>
						<sl-menu class="w-fit">
							<For each={getResourcesLinks()}>
								{(link) => (
									<>
										<sl-menu-item>
											<a
												href={link.href} target="_blank"
											>
												{link.name}
											</a>
										</sl-menu-item>
										<Show when={link.name === "About the ecosystem" || link.name === "Submit Feedback"}>
											<div class="w-full border-b border-surface-200 my-1" />
										</Show>
									</>
								)}
							</For>
						</sl-menu>
					</sl-dropdown>
					<div class="opacity-0 transition-opacity peer-hover:opacity-100 absolute text-sm bg-inverted-surface text-on-inverted-surface py-1 px-2 rounded right-0 bottom-8 whitespace-nowrap">
						Help and resources
					</div>
				</div>
			</div>
		</footer>
	)
}

export default Footer

/* Custom X icon as it is not available within unplugin */
export function IconX() {
	return (
		<svg
			width="19"
			height="auto"
			viewBox="0 0 24 23"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M18.8782 0.660156H22.5582L14.4782 9.86016L23.9182 22.3402H16.5102L10.7102 14.7562L4.07016 22.3402H0.390156L8.95016 12.5002L-0.0898438 0.660156H7.50216L12.7422 7.58816L18.8782 0.660156ZM17.5902 20.1802H19.6302L6.43016 2.74016H4.23816L17.5902 20.1802Z"
				fill="currentColor"
			/>
		</svg>
	)
}
