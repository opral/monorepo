import { For } from "solid-js"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"
import Link from "#src/renderer/Link.jsx"
import version from "../../../version.json"

export const getFinkResourcesLinks = () => {
	return [
		{
			name: "About Fink",
			href: import.meta.env.PROD
				? "https://inlang.com/m/tdozzpar"
				: "http://localhost:3000/m/tdozzpar",
		},
		{
			name: "User Guide",
			href: import.meta.env.PROD
				? "https://inlang.com/g/6ddyhpoi"
				: "http://localhost:3000/g/6ddyhpoi",
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
			href: "https://github.com/opral/monorepo/discussions/categories/-fink-general",
		},
		{
			name: "Submit Feedback",
			href: "https://github.com/orgs/opral/discussions/categories/-fink-general",
		},
	]
}

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

	return (
		<footer class="bg-background border-t border-surface-200 py-4 px-4 overflow-visible">
			<div class="max-w-7xl mx-auto flex justify-between gap-4 xl:px-4 h-6">
				<div class="flex items-center justify-between w-24">
					<p class="text-sm text-surface-500">© {new Date().getFullYear().toString()} Opral</p>
				</div>
				<div class="flex gap-4">
					<For each={socialMediaLinks}>
						{(link) => (
							<Link
								target="_blank"
								class={"link link-primary flex space-x-2 items-center text-xs"}
								href={link.href}
							>
								<link.Icon class="w-5 h-5" />
								<span class="sr-only">{link.name}</span>
							</Link>
						)}
					</For>
				</div>
				<div class="flex items-center justify-end w-24">
					<sl-dropdown prop:distance={8}>
						<button slot="trigger" class="text-sm text-surface-500">
							{version["commit-hash"].slice(0, 7)}
						</button>
						<sl-menu class="flex flex-col px-4 py-3 text-sm w-60">
							<span class="font-medium mb-2">Deployed version</span>
							<div class="flex justify-between">
								<span>Commit hash: {""}</span>
								<a
									href={`https://github.com/opral/monorepo/commit/${version["commit-hash"]}`}
									target="_blank"
									class="text-primary"
								>
									{version["commit-hash"].slice(0, 7)}
								</a>
							</div>
							<div class="flex justify-between">
								<span>SDK version:</span>
								<span>{version["@inlang/sdk"]}</span>
							</div>
							<div class="flex justify-between">
								<span>Lix client version:</span>
								<span>{version["@lix-js/client"]}</span>
							</div>
						</sl-menu>
					</sl-dropdown>
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
