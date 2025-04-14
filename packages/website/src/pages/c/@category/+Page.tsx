import { For, Show, createSignal, type JSX } from "solid-js";
import { GetHelp } from "#src/interface/components/GetHelp.jsx";
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import Card, {
	CardBuildOwn,
	NoResultsCard,
} from "#src/interface/components/Card.jsx";
import { Link, Meta, Title } from "@solidjs/meta";
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import * as m from "#src/paraglide/messages.js";
import type { MarketplaceManifest } from "@inlang/marketplace-manifest";
import TitleSection from "#src/interface/marketplace/categoryHeaders/titleSection.jsx";
import PluginHeader from "#src/interface/marketplace/categoryHeaders/toast/plugins.jsx";
import ParaglideHeader from "#src/interface/marketplace/categoryHeaders/cards/paraglide.jsx";
import LintRulesHeader from "#src/interface/marketplace/categoryHeaders/toast/lintRules.jsx";
import LixHeader from "#src/interface/marketplace/categoryHeaders/cards/lix.jsx";
import { renderLocales } from "#src/renderer/renderLocales.js";
import SvelteHeader from "#src/interface/marketplace/categoryHeaders/cards/svelte.jsx";
import NextjsHeader from "#src/interface/marketplace/categoryHeaders/cards/nextjs.jsx";
import GenericHeader from "#src/interface/marketplace/categoryHeaders/cards/generic.jsx";
import AppHeader from "#src/interface/marketplace/categoryHeaders/categoryHeros/appHeader.jsx";
import AstroHeader from "#src/interface/marketplace/categoryHeaders/cards/astro.jsx";
import Stacks from "#src/interface/marketplace/categoryHeaders/toast/stacks.jsx";
import RemixHeader from "#src/interface/marketplace/categoryHeaders/cards/remix.jsx";

type SubCategoryApplication = "app" | "library" | "plugin" | "messageLintRule";

export type Category = "application" | "markdown" | "email";
export type SubCategory = SubCategoryApplication;

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("");
const selectedCategory = () => {
	return currentPageContext.urlParsed.pathname.replace("/", "");
};

type PossibleSectionsType = Array<
	| "apps"
	| "libraries"
	| "plugins"
	| "guides"
	| "guides-developer"
	| "guides-translator"
	| "guides-change-control"
	| "guides-general"
	| "guides-i18n"
	| "all"
>;

export default function Page(props: {
	minimal?: boolean;
	highlights?: Record<string, string>[];
	category?: Category | undefined;
	slider?: boolean;
	items: Awaited<ReturnType<any>>;
}) {
	type HeaderContentType = {
		title: string;
		description: string;
		buttonLink?: string;
		buttonText?: string;
		icon?: string;
		sections?: PossibleSectionsType;
		coverCard?: JSX.Element;
	};

	const getCategoryContent = (): HeaderContentType | undefined => {
		switch (currentPageContext.routeParams.category) {
			case "apps":
				return {
					title: m.marketplace_header_apps_title(),
					description: m.marketplace_header_apps_description(),
					buttonLink: "/documentation/sdk/build-app",
					buttonText: m.marketplace_header_apps_button_text(),
					coverCard: <AppHeader />,
					sections: ["all"],
				};
			case "plugins":
				return {
					title: m.marketplace_header_plugins_title(),
					description: m.marketplace_header_plugins_description(),
					buttonLink: "/documentation/plugin/guide",
					buttonText: m.marketplace_header_plugins_button_text(),
					coverCard: <PluginHeader />,
					sections: ["all"],
				};
			case "lix":
				return {
					title: m.marketplace_header_lix_title(),
					description: m.marketplace_header_lix_short_description(),
					buttonLink: "https://lix.opral.com",
					buttonText: m.marketplace_header_lix_button_text(),
					sections: ["all"],
					coverCard: <LixHeader />,
				};
			case "svelte":
				return {
					title: m.marketplace_header_svelte_title(),
					description: m.marketplace_header_svelte_description(),
					icon: "https://avatars.githubusercontent.com/u/23617963?s=200&v=4",
					sections: ["apps", "guides", "plugins", "libraries"],
					coverCard: <SvelteHeader />,
				};
			case "nextjs":
				return {
					title: m.marketplace_header_nextjs_title(),
					description: m.marketplace_header_nextjs_description(),
					icon: "https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png",
					sections: ["apps", "guides", "plugins", "libraries"],
					coverCard: <NextjsHeader />,
				};
			case "remix":
				return {
					title: "Remix - i18n Tooling",
					description:
						"Recommend internationalization tooling for your Remix app.",
					icon: "https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/external-projects/remix-paraglidejs/assets/remix.svg",
					sections: ["apps", "guides", "plugins", "libraries"],
					coverCard: <RemixHeader />,
				};
			case "solid": {
				return {
					title: m.marketplace_header_solid_title(),
					description: m.marketplace_header_solid_description(),
					icon: "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-solidstart/assets/icon.png",
					sections: ["apps", "guides", "plugins", "libraries"],
					coverCard: <GenericHeader />,
				};
			}
			case "astro": {
				return {
					title: m.marketplace_header_astro_title(),
					description: m.marketplace_header_astro_description(),
					icon: "https://astro.build/favicon.svg",
					sections: ["apps", "guides", "plugins", "libraries"],
					coverCard: <AstroHeader />,
				};
			}

			default:
				return {
					title:
						currentPageContext.urlParsed.pathname
							.split("/")[2]
							?.toUpperCase() || m.marketplace_header_generic_title(),
					description: m.marketplace_header_generic_description(),
					coverCard: <GenericHeader />,
					sections: ["all"],
				};
		}
	};

	return (
		<>
			<Title>
				{currentPageContext.routeParams.category === "svelte" ||
				currentPageContext.routeParams.category === "nextjs"
					? getCategoryContent()?.title + " "
					: (currentPageContext.routeParams.category?.toLowerCase() === "lix" ||
					  currentPageContext.routeParams.category?.toLowerCase() === "guides"
							? ""
							: "Global" + " ") +
					  ((currentPageContext.routeParams.category?.toLowerCase() === "lix"
							? currentPageContext.routeParams.category
							: currentPageContext.routeParams.category
									?.replaceAll("-", " ")
									.replace(/\w\S*/g, (w: string) =>
										w.replace(/^\w/, (c) => c.toUpperCase())
									)) +
							" ")}
				| inlang
			</Title>
			<Meta
				name="description"
				content={
					currentPageContext.routeParams.category === "svelte" ||
					currentPageContext.routeParams.category === "nextjs"
						? getCategoryContent()?.description
						: `Find everything globalization (i18n) related to ${currentPageContext.routeParams.category?.replaceAll(
								"-",
								" "
						  )} - inlang`
				}
			/>
			<Meta
				name="og:image"
				content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/website/public/opengraph/inlang-social-image.jpg"
			/>
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta
				name="twitter:image"
				content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/website/public/opengraph/inlang-social-image.jpg"
			/>
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta
				name="twitter:title"
				content={`${
					currentPageContext.routeParams.category === "svelte" ||
					currentPageContext.routeParams.category === "nextjs"
						? getCategoryContent()?.title + " "
						: (currentPageContext.routeParams.category?.toLowerCase() ===
								"lix" ||
						  currentPageContext.routeParams.category?.toLowerCase() ===
								"guides"
								? ""
								: "Global" + " ") +
						  ((currentPageContext.routeParams.category?.toLowerCase() === "lix"
								? currentPageContext.routeParams.category
								: currentPageContext.routeParams.category
										?.replaceAll("-", " ")
										.replace(/\w\S*/g, (w: string) =>
											w.replace(/^\w/, (c) => c.toUpperCase())
										)) +
								" ")
				} | inlang`}
			/>
			<Meta
				name="twitter:description"
				content={
					currentPageContext.routeParams.category === "svelte" ||
					currentPageContext.routeParams.category === "nextjs"
						? getCategoryContent()?.description
						: `Find everything globalization (i18n) related to ${currentPageContext.routeParams.category?.replaceAll(
								"-",
								" "
						  )} - inlang`
				}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			{renderLocales(currentPageContext.urlParsed.pathname).map((locale) => (
				<Link href={locale.href} lang={locale.hreflang} rel={locale.rel} />
			))}
			{/* <Link
				href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
				rel="canonical"
			/> */}
			<MarketplaceLayout>
				<Show
					when={currentPageContext.routeParams.category && getCategoryContent()}
				>
					<TitleSection
						title={getCategoryContent()!.title}
						description={getCategoryContent()!.description}
						buttonLink={getCategoryContent()!.buttonLink}
						buttonText={getCategoryContent()!.buttonText}
						icon={getCategoryContent()!.icon}
					/>
					<Show when={getCategoryContent()?.coverCard}>
						{getCategoryContent()?.coverCard}
					</Show>
				</Show>
				<div class="pb-16 md:pb-20 min-h-screen relative">
					<SectionLayout showLines={false} type="white">
						<div class="min-h-[70vh]">
							<Show
								when={!getCategoryContent()?.sections?.includes("all")}
								fallback={
									<Gallery items={props.items} hideBuildYourOwn={false} />
								}
							>
								{/* Guides */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes("guides") &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.id.split(".")[0] === "guide"
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Guides
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.id.split(".")[0] === "guide"
										)}
										hideBuildYourOwn
									/>
								</Show>
								{/* Apps */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes("apps") &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.id.split(".")[0] === "app" ||
												item.id.split(".")[0] === "library"
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Apps
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.id.split(".")[0] === "app" ||
												item.id.split(".")[0] === "library"
										)}
										hideBuildYourOwn
									/>
								</Show>
								{/* Plugins */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes("plugins") &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.id.split(".")[0] === "plugin"
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Extend with plugins
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.id.split(".")[0] === "plugin"
										)}
									/>
								</Show>
								{/* Developer */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes(
											"guides-developer"
										) &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-developer")
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Guides for developers
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-developer")
										)}
										hideBuildYourOwn
									/>
								</Show>
								{/* Change control */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes(
											"guides-change-control"
										) &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-change-control")
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Guides about change control
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-change-control")
										)}
										hideBuildYourOwn
									/>
								</Show>
								{/* General */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes(
											"guides-general"
										) &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-general")
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Guides about inlang
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-general")
										)}
										hideBuildYourOwn
									/>
								</Show>
								{/* i18n */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes("guides-i18n") &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-i18n")
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Guides about globalization
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-i18n")
										)}
										hideBuildYourOwn
									/>
								</Show>
								{/* Translator */}
								<Show
									when={
										props.items &&
										getCategoryContent()?.sections?.includes(
											"guides-translator"
										) &&
										props.items.some(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-translator")
										)
									}
								>
									<h2 class="pb-4 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
										Guides for translators
									</h2>
									<Gallery
										items={props.items.filter(
											(item: MarketplaceManifest & { uniqueID: string }) =>
												item.keywords.includes("guides-translator")
										)}
										hideBuildYourOwn
									/>
								</Show>
							</Show>
							<Show when={false}>
								<NoResultsCard category={selectedCategory()} />
							</Show>
							<Show
								when={
									selectedCategory().includes("c/plugins") ||
									selectedCategory().includes("c/apps") ||
									selectedCategory().includes("c/lint-rules")
								}
							>
								<Stacks />
							</Show>
						</div>
						<Show when={!props.category && !props.slider && !props.minimal}>
							<div class="mt-20">
								<GetHelp text="Need help or have questions? Join our Discord!" />
							</div>
						</Show>
					</SectionLayout>
				</div>
			</MarketplaceLayout>
		</>
	);
}

const Gallery = (props: { items: any; hideBuildYourOwn?: boolean }) => {
	return (
		<div class="mb-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Show when={props.items && props.items.length > 0}>
				<For each={props.items}>
					{(item) => {
						const displayName =
							typeof item.displayName === "object"
								? item.displayName.en
								: item.displayName;

						return <Card item={item} displayName={displayName} />;
					}}
				</For>
				<Show when={!props.hideBuildYourOwn}>
					<CardBuildOwn />
				</Show>
			</Show>
		</div>
	);
};
