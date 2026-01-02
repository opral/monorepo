import { For } from "solid-js";
import { Arrow } from "./Developer.jsx";
import Link from "#src/renderer/Link.jsx";
import { Button } from "../../components/Button.jsx";
import * as m from "#src/paraglide/messages.js";

const TranslatorSlide = () => {
	const cards = [
		{
			title: m.home_personas_translator_cards_fink_title(),
			description: m.home_personas_translator_cards_fink_description(),
			href: "/m/tdozzpar",
			logo: "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/editor/assets/new-fink-logo.png",
			cover: "/images/fink-cover-landingpage.png",
		},
		{
			title: m.home_personas_translator_cards_badge_title(),
			description: m.home_personas_translator_cards_badge_description(),
			href: "/m/zu942ln6",
			logo: "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/badge/assets/images/badge-icon.jpg",
			cover: "/images/badge-cover-landingpage.png",
		},
	];

	return (
		<div class="flex flex-col gap-4 px-6 md:px-8 py-6 h-full">
			<div>
				<div class="flex items-center justify-between">
					<h3 class="font-medium text-surface-600">
						{m.home_personas_translator_apps_title()}
					</h3>
					<Link
						class="flex items-center gap-2 text-surface-500 group"
						href="/c/apps"
					>
						<p class="group-hover:text-surface-600">
							{m.home_personas_developer_more_apps()}
						</p>
						<div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
							<Arrow />
						</div>
					</Link>
				</div>
				<div class="grid md:grid-cols-2 min-h-[400px] md:min-h-[264px] h-[calc(100vw)] sm:h-[600px] md:h-[154px] gap-4 mt-4">
					<For each={cards}>
						{(card) => (
							<Link
								class="relative bg-gradient-to-b from-surface-200 rounded-xl p-[1px] hover:from-surface-300 transition-all"
								href={card.href}
							>
								<div class="absolute w-full top-0 left-0 pointer-events-none">
									<img src={card.cover} alt="cover" />
								</div>
								<div class="flex flex-col justify-end col-span-1 h-full rounded-[11px] bg-gradient-to-b from-surface-50 hover:from-surface-100 to-background hover:to-background p-6">
									<div class="flex items-center gap-4">
										<div class="w-10 h-10 rounded overflow-hidden">
											<img src={card.logo} alt="logo" />
										</div>
										<div>
											<h4 class="font-bold text-surface-600">{card.title}</h4>
											<p class="text-surface-500 text-sm">{card.description}</p>
										</div>
									</div>
								</div>
							</Link>
						)}
					</For>
				</div>
			</div>
			<div>
				<h3 class="font-medium text-surface-600">
					{m.home_personas_translator_guide_title()}
				</h3>
				<div class="flex flex-col md:flex-row gap-8 md:justify-between md:items-center p-6 md:p-4 border border-surface-200 mt-4 rounded-xl bg-gradient-to-b from-surface-50">
					<div class="flex-1 flex flex-col md:flex-row md:items-center gap-4">
						<p class="font-semibold text-primary bg-primary/20 px-4 py-1.5 rounded-lg w-fit">
							{m.home_personas_translator_guide_type()}
						</p>
						<h3 class="text-surface-900 font-semibold">
							{m.home_personas_translator_guide_tagline()}
						</h3>
						<p class="text-surface-500">
							{m.home_personas_translator_guide_description()}
						</p>
					</div>
					<Button
						chevron
						type="secondary"
						href="/g/6ddyhpoi/guide-nilsjacobsen-contributeTranslationsWithFink"
						class="flex-1"
					>
						{m.home_personas_translator_guide_button()}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default TranslatorSlide;
