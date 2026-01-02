import { For, Show, createSignal, onMount } from "solid-js";
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
import validator from "validator";
import { i18nRouting } from "#src/services/i18n/routing.js";

type SubCategoryApplication = "app" | "library" | "plugin" | "messageLintRule";

export type Category = "application" | "markdown" | "email" | "website";
export type SubCategory = SubCategoryApplication;

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("");
const selectedCategory = () => {
	return currentPageContext.urlParsed.pathname.replace("/", "");
};

const sanitize = (input: string): string => {
	return validator.default.escape(input);
};

export default function Page(props: {
	minimal?: boolean;
	highlights?: Record<string, string>[];
	category?: Category | undefined;
	slider?: boolean;
	items: Awaited<ReturnType<any>>;
}) {
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (
			urlParams.get("search") !== "" &&
			urlParams.get("search") !== undefined
		) {
			setSearchValue(urlParams.get("search")?.replace(/%20/g, " ") || "");
		}
	});

	const title = () => {
		if (
			currentPageContext.urlParsed.search.q !== "" &&
			currentPageContext.urlParsed.search.q !== undefined
		) {
			return `${m.marketplace_search_seo_title()} ${sanitize(
				currentPageContext.urlParsed.search.q
			)} ${m.marketplace_search_seo_global_products()}`;
		} else {
			return m.marketplace_search_seo_title();
		}
	};

	return (
		<>
			<Title>{title()}| inlang</Title>
			<Meta name="description" content="Search globalization products." />
			<Meta
				name="og:image"
				content="https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg"
			/>
			<Link
				href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
				rel="canonical"
			/>
			<MarketplaceLayout>
				<div class="pb-16 md:pb-20 min-h-screen relative">
					<h2 class="text-md text-surface-600 pb-4 pt-8">
						{m.marketplace_grid_title_generic()}
					</h2>
					<SectionLayout showLines={false} type="white">
						<div class="relative">
							<div class="mb-32 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
								<Gallery items={props.items} />
							</div>

							<Show when={!props.category && !props.slider && !props.minimal}>
								<div class="mt-20">
									<GetHelp text="Need help or have questions? Join our Discord!" />
								</div>
							</Show>
						</div>
					</SectionLayout>
				</div>
			</MarketplaceLayout>
		</>
	);
}

const Gallery = (props: { items: any }) => {
	return (
		<>
			<Show
				when={props.items && props.items.length > 0}
				fallback={<NoResultsCard category={selectedCategory()} />}
			>
				<For each={props.items}>
					{(item) => {
						const displayName =
							typeof item.displayName === "object"
								? item.displayName.en
								: item.displayName;

						return <Card item={item} displayName={displayName} />;
					}}
				</For>
				<CardBuildOwn />
			</Show>
		</>
	);
};
