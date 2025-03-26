import { Meta, Title } from "@solidjs/meta";
import { createEffect, For, Show } from "solid-js";
import type { MarketplaceManifest } from "@inlang/marketplace-manifest";
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import Card from "#src/interface/components/Card.jsx";
import InlangDoclayout from "#src/interface/components/doc-layout-solid/doc-layout.jsx";
import { GetHelp } from "#src/interface/components/GetHelp.jsx";
import { DeprecationBanner } from "#src/interface/marketplace/DeprecationBanner.jsx";

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	markdown: Awaited<ReturnType<any>>;
	pages: Record<string, string> | undefined;
	pageData: Record<string, unknown>;
	pagePath: string;
	tableOfContents: Record<string, string[]>;
	manifest: MarketplaceManifest & { uniqueID: string };
	recommends?: MarketplaceManifest[];
};

export default function Page(props: PageProps) {
	createEffect(() => {
		// import the custom elements of the document
		// todo sanitize the imports
		if (!import.meta.env.SSR) {
			// @ts-expect-error
			for (const url of props.pageData?.imports ?? []) {
				import(url);
			}
		}
	});

	// mapping translatable types
	const displayName = () =>
		typeof props.manifest.displayName === "object"
			? props.manifest.displayName.en
			: props.manifest.displayName;

	const description = () =>
		typeof props.manifest.description === "object"
			? props.manifest.description.en
			: props.manifest.description;

	const pageTitle = () => {
		if (props.pageData?.title && props.manifest) {
			return `${props.pageData.title} | ${displayName()} | inlang`;
		} else if (props.manifest) {
			return `${displayName()} ${
				props.manifest.publisherName === "inlang"
					? "| inlang"
					: `from ${props.manifest.publisherName} | inlang`
			}`;
		} else {
			return "Product page | inlang";
		}
	};

	const metaDescription = () => {
		if (props.pageData?.description) {
			return props.pageData.description as string;
		} else if (props.manifest) {
			return description();
		} else {
			return "Here comes an inlang product.";
		}
	};

	return (
		<>
			<Title>{pageTitle()}</Title>
			<Meta name="description" content={metaDescription()} />
			{props.manifest &&
			props.manifest.gallery &&
			props.manifest.gallery.length > 0 ? (
				<Meta name="og:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta
					name="og:image"
					content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/website/public/opengraph/inlang-social-image.jpg"
				/>
			)}
			<Meta name="twitter:card" content="summary_large_image" />
			{props.manifest &&
			props.manifest.gallery &&
			props.manifest.gallery.length > 0 ? (
				<Meta name="twitter:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta
					name="twitter:image"
					content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/website/public/opengraph/inlang-social-image.jpg"
				/>
			)}
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta name="twitter:title" content={pageTitle()} />
			<Meta name="twitter:description" content={metaDescription()} />
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<MarketplaceLayout manifest={props.manifest}>
				<Show when={props.markdown && props.manifest}>
					<div class="w-full h-full">
						<InlangDoclayout
							manifest={props.manifest}
							currentRoute={props.pagePath}
						>
							<DeprecationBanner manifest={props.manifest} />
							{/* eslint-disable-next-line solid/no-innerhtml */}
							<article class="w-full my-12" innerHTML={props.markdown} />
						</InlangDoclayout>
						<div class="mt-20">
							<GetHelp text="Do you have questions?" />
						</div>
						<Show when={props.recommends && props.recommends.length > 0}>
							<div class="my-12">
								<Recommends recommends={props.recommends!} />
							</div>
						</Show>
					</div>
				</Show>
			</MarketplaceLayout>
		</>
	);
}

export function Recommends(props: { recommends: MarketplaceManifest[] }) {
	return (
		<>
			<h3 class="font-semibold mb-4">Recommended</h3>
			<div class="flex items-center gap-4 md:flex-row flex-col">
				<For each={props.recommends}>
					{/* @ts-ignore */}
					{(item) => <Card item={item} displayName={item.displayName.en} />}
				</For>
			</div>
		</>
	);
}
