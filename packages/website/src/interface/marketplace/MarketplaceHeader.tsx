import { For, Show } from "solid-js";
import IconGithub from "~icons/cib/github";
import IconDiscord from "~icons/cib/discord";
import { IconX } from "../components/Icon.jsx";
import Link from "#src/renderer/Link.jsx";
import * as m from "#src/paraglide/messages.js";
import { LanguagePicker } from "#src/pages/index/LanguagePicker.jsx";
import { Banner } from "../components/Banner.jsx";
import { languageTag } from "#src/paraglide/runtime.js";

const MarketplaceHeader = (props: { withBorder: boolean }) => {
	const socialMediaLinks = [
		{
			name: "X",
			href: "https://x.com/inlangHQ",
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
	];

	return (
		<>
			<Show when={languageTag() !== "en" && languageTag() !== "de"}>
				<Banner
					text="This language is community translated. Contribute to the translation here."
					href="https://fink.inlang.com/github.com/opral/monorepo"
				/>
			</Show>
			<header
				class={`sticky top-0 w-full z-[9999] sm:bg-background border-surface-200 md:px-4 ${
					props.withBorder && "border-b"
				}`}
			>
				<div
					class={
						"max-w-7xl mx-auto flex justify-between items-center relative sm:static mb-0 gap-3 px-4 md:px-0 bg-background"
					}
				>
					<Link
						href={"/"}
						class="flex items-center w-fit pointer-events-auto py-4 transition-opacity hover:opacity-75"
					>
						<img
							class={"h-8 w-8 rounded"}
							src="/favicon/safari-pinned-tab.svg"
							alt="Company Logo"
						/>
						<span
							class={
								"self-center pl-2 text-left font-semibold text-surface-900"
							}
						>
							inlang
						</span>
					</Link>
					<div class="static top-0 lg:absolute lg:top-4 lg:left-1/2 lg:-translate-x-1/2 flex-1 sm:max-w-sm md:w-80 mx-0">
						<div id="search-input"></div>
					</div>
					<div class="flex gap-8 items-center">
						<a
							class="hidden text-surface-700 hover:text-primary pointer-events-auto md:flex justify-center items-center h-10 relative gap-2 rounded-md flex-grow-0 flex-shrink-0 text-sm font-medium text-left cursor-pointer transition-all duration-200"
							href="https://opral.substack.com/t/inlang"
							target="_blank"
						>
							Blog
						</a>
						<a
							class="hidden text-surface-700 hover:text-primary pointer-events-auto md:flex justify-center items-center h-10 relative gap-2 rounded-md flex-grow-0 flex-shrink-0 text-sm font-medium text-left cursor-pointer transition-all duration-200"
							target="_blank"
							href="https://github.com/opral/inlang-sdk"
						>
							{m.marketplace_header_build_on_inlang_button()}
						</a>

						<div class="gap-[2px] items-center hidden md:flex">
							<For each={socialMediaLinks}>
								{(link) => (
									<Link
										target="_blank"
										class={
											"text-surface-700 hover:text-primary flex space-x-2 items-center p-2"
										}
										href={link.href}
									>
										<link.Icon class="w-5 h-5" />
										<span class="sr-only">{link.name}</span>
									</Link>
								)}
							</For>
						</div>
						<LanguagePicker />
					</div>
				</div>
			</header>
		</>
	);
};

export default MarketplaceHeader;
