import { Meta, Title } from "@solidjs/meta"
import { For, Show, createSignal, onMount, Switch, Match } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { isModule } from "@inlang/marketplace-registry"
import { Button } from "#src/pages/index/components/Button.jsx"
import { Chip } from "#src/interface/components/Chip.jsx"
import ArrowOutward from "~icons/material-symbols/arrow-outward"
import {
	colorForTypeOf,
	convertLinkToGithub,
	typeOfIdToTitle,
} from "#src/interface/marketplace/helper/utilities.js"
import { languageTag } from "#src/paraglide/runtime.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { currentPageContext } from "#src/renderer/state.js"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import Card from "#src/interface/components/Card.jsx"
import EditOutline from "~icons/material-symbols/edit-outline-rounded"
import Documentation from "~icons/material-symbols/description-outline-rounded"
import Changelog from "~icons/material-symbols/manage-history"
import Link from "#src/renderer/Link.jsx"

const isProduction = process.env.NODE_ENV === "production"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	markdown: Awaited<ReturnType<any>>
	tab: string | boolean
	tableOfContents: Record<string, string[]>
	manifest: MarketplaceManifest & { uniqueID: string }
	recommends?: MarketplaceManifest[]
}

const pagesToHideSlider = ["badge", "editor", "ide", "cli", "paraglide"]

const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
	const element = document.getElementById(anchor)
	if (element && window) {
		window.scrollTo({
			top: element.offsetTop - 128,
			behavior: behavior ?? "instant",
		})
	}
	window.history.pushState(
		{},
		"",
		`${currentPageContext.urlParsed.pathname}${
			currentPageContext.urlParsed.search.view
				? `?view=${currentPageContext.urlParsed.search.view}`
				: ""
		}#${anchor}`
	)
}

export default function Page(props: PageProps) {
	const [readmore, setReadmore] = createSignal<boolean>(false)

	// mapping translatable types
	const displayName = () =>
		typeof props.manifest.displayName === "object"
			? props.manifest.displayName.en
			: props.manifest.displayName

	const description = () =>
		typeof props.manifest.description === "object"
			? props.manifest.description.en
			: props.manifest.description

	const readme = () =>
		typeof props.manifest.readme === "object" ? props.manifest.readme.en : props.manifest.readme

	return (
		<>
			<Title>{`${
				props.tab === "changelog"
					? `Changelog ${props.manifest && displayName()}`
					: props.manifest && displayName()
			} ${
				props.manifest &&
				(props.manifest.publisherName === "inlang"
					? "| inlang"
					: `from ${props.manifest.publisherName} | inlang`)
			}`}</Title>
			<Meta
				name="description"
				content={
					props.manifest &&
					(props.tab === "changelog"
						? `The changelogs with major and minor versions of ${displayName()}`
						: description())
				}
			/>
			{props.manifest && props.manifest.gallery ? (
				<Meta name="og:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta
					name="og:image"
					content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/website/public/opengraph/inlang-social-image.jpg"
				/>
			)}
			<Meta name="twitter:card" content="summary_large_image" />
			{props.manifest && props.manifest.gallery ? (
				<Meta name="twitter:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta
					name="twitter:image"
					content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/website/public/opengraph/inlang-social-image.jpg"
				/>
			)}
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta name="twitter:title" content={props.manifest && displayName()} />
			<Meta
				name="twitter:description"
				content={
					props.manifest &&
					(props.tab === "changelog"
						? `The changelogs with major and minor versions of ${displayName()}`
						: description())
				}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<MarketplaceLayout>
				<Show when={props.markdown && props.manifest}>
					<div class="md:py-16 py-8">
						<div class="w-full grid grid-cols-1 md:grid-cols-4 pb-32">
							<Show
								when={props.markdown}
								fallback={<p class="text-danger">{props.markdown?.error}</p>}
							>
								<section class="col-span-1 md:col-span-4 pb-4 md:pb-0 grid md:grid-cols-4 grid-cols-1 md:gap-16">
									<div class="flex-col h-full justify-between md:col-span-3">
										<div class="flex max-md:flex-col items-start gap-8">
											<Show
												when={props.manifest.icon}
												fallback={
													<div class="w-16 h-16 font-semibold text-3xl rounded-md m-0 object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
														{displayName()[0]}
													</div>
												}
											>
												<img
													class="w-16 h-16 rounded-md m-0 object-cover object-center"
													alt={displayName()}
													src={props.manifest.icon}
												/>
											</Show>
											<div class="mb-0">
												<div class="flex gap-3 flex-col">
													<div class="flex flex-col lg:flex-row gap-4 lg:items-center">
														<h1 class="text-3xl font-bold">{displayName()}</h1>

														<Show
															when={
																props.manifest.keywords
																	.map((keyword: string) => keyword.toLowerCase())
																	.includes("external") &&
																!props.manifest.keywords
																	.map((keyword: string) => keyword.toLowerCase())
																	.includes("inlang")
															}
														>
															<EcosystemIncompatibleBadgeBig />
														</Show>
													</div>
													<div class="inline-block text-surface-500 ">
														<p class={!readmore() ? "lg:line-clamp-2" : ""}>{description()}</p>
														<Show when={description().length > 205}>
															<p
																onClick={() => setReadmore((prev) => !prev)}
																class="cursor-pointer hover:text-surface-700 transition-all duration-150 font-medium max-lg:hidden"
															>
																{readmore() ? "Minimize" : "Read more"}
															</p>
														</Show>
													</div>
												</div>
												<div class="flex gap-4 flex-wrap">
													<Switch>
														{/* IS MODULE */}
														<Match when={isModule(props.manifest)}>
															<div class="flex items-center gap-2">
																{/* @ts-ignore */}
																<Button
																	type="primary"
																	href={`${
																		isProduction
																			? "https://manage.inlang.com/install"
																			: "http://localhost:4004/install"
																	}?module=${props.manifest.id}`}
																	class="my-6"
																>
																	<span class="capitalize">
																		Install{" "}
																		{props.manifest.id.includes("messageLintRule")
																			? "Lint Rule"
																			: typeOfIdToTitle(props.manifest.id)}
																	</span>
																</Button>
															</div>
														</Match>
														{/* IS NO MODULE */}
														<Match when={!isModule(props.manifest)}>
															<>
																<Show when={props.manifest.website}>
																	{/* @ts-ignore */}
																	<Button type="primary" class="my-6" href={props.manifest.website}>
																		Open{" "}
																		<Show when={props.manifest.website?.includes("http")}>
																			<ArrowOutward />
																		</Show>
																	</Button>
																</Show>
															</>
														</Match>
													</Switch>
												</div>
											</div>
										</div>
										<Show
											when={
												props.manifest.gallery &&
												props.manifest.gallery.length > 2 &&
												!pagesToHideSlider.some((page) =>
													currentPageContext.urlParsed.pathname.includes(page)
												)
											}
										>
											<div class="mt-12">
												{/* @ts-ignore */}
												<doc-slider items={props.manifest.gallery!.map((item) => item).join(",")} />
											</div>
										</Show>
										<Show
											when={
												props.manifest.gallery &&
												props.manifest.gallery.length === 1 &&
												props.manifest.id.includes("messageLintRule")
											}
										>
											<div class="pt-12">
												<img
													alt={
														props.manifest.gallery && props.manifest.gallery[0]!.split("/").at(-1)
													}
													src={props.manifest.gallery && props.manifest.gallery[0]}
													class="max-w-sm mx-auto rounded-lg border border-surface-100 shadow-md shadow-on-background/[0.02]"
												/>
											</div>
										</Show>
										<Show when={props.tab}>
											<div class="flex items-center gap-6 mt-6 w-full border-b border-surface-2">
												<a
													onClick={() => {
														typeof window !== "undefined" &&
															window.location.replace(`${currentPageContext.urlParsed.pathname}`)
													}}
													class={
														(props.tab !== "changelog"
															? "border-hover-primary "
															: "border-background/0 ") +
														" border-b-[2px] pt-[8px] pb-[6px] text-sm bg-transparent group content-box group"
													}
												>
													<div
														class={
															(props.tab !== "changelog"
																? "text-surface-900 "
																: "text-surface-500 group-hover:bg-surface-100 ") +
															" px-2 py-[6px] flex items-center gap-1.5 rounded-md transition-colors font-medium cursor-pointer w-max"
														}
													>
														<Documentation class="inline-block" />
														Documentation
													</div>
												</a>
												<a
													onClick={(e) => {
														e.preventDefault()
														typeof window !== "undefined" &&
															window.location.replace(
																`${currentPageContext.urlParsed.pathname}?view=changelog`
															)
													}}
													class={
														//todo: fix this
														(props.tab === "changelog"
															? "border-hover-primary "
															: "border-background/0 ") +
														" border-b-[2px] pt-[8px] pb-[6px] text-sm bg-transparent group content-box group"
													}
												>
													<div
														class={
															(props.tab === "changelog"
																? "text-surface-900 "
																: "text-surface-500 group-hover:bg-surface-100 ") +
															" px-2 py-[6px] flex items-center gap-1.5 rounded-md transition-colors font-medium cursor-pointer w-max"
														}
													>
														<Changelog class="inline-block" />
														Changelog
													</div>
												</a>
											</div>
										</Show>
										<Show
											when={props.markdown}
											fallback={
												<Show
													when={props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)}
													fallback={<Markdown markdown={props.markdown} />}
												>
													<div class="grid md:grid-cols-4 grid-cols-1 gap-16 md:mb-32 mb-8">
														<div class="w-full rounded-lg col-span-1 md:col-span-4">
															<Markdown markdown={props.markdown} />
														</div>
													</div>
												</Show>
											}
										>
											<Show
												when={props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)}
												fallback={<Markdown markdown={props.markdown} />}
											>
												<div class="grid md:grid-cols-4 grid-cols-1 gap-16 md:mb-32 mb-8">
													<div class="w-full rounded-lg col-span-1 md:col-span-4">
														<Markdown markdown={props.markdown} />
													</div>
												</div>
											</Show>
										</Show>
									</div>
									<div class="w-full">
										<div class="flex flex-col gap-6 items-col flex-shrink-0">
											<Show
												when={props.manifest.keywords
													.map((keyword: string) => keyword.toLowerCase())
													.includes("lix")}
											>
												<div>
													<h3 class="text-surface-400 text-sm mb-2">Change control</h3>
													<Link href="/c/lix">
														<div class="w-16 text-primary hover:text-hover-primary group transition-colors">
															<sl-tooltip prop:content="Click to view all">
																<LixBadge />
															</sl-tooltip>
														</div>
													</Link>
												</div>
											</Show>
											<div>
												<h3 class="text-surface-400 text-sm mb-2">Publisher</h3>
												<div class="flex items-center gap-2">
													<Show
														when={props.manifest.publisherIcon}
														fallback={
															<div
																class={
																	"w-6 h-6 flex items-center justify-center text-background capitalize font-medium rounded-full m-0 bg-surface-900"
																}
															>
																{props.manifest.publisherName[0]}
															</div>
														}
													>
														<img
															alt={props.manifest.publisherName}
															class="w-6 h-6 rounded-full m-0"
															src={props.manifest.publisherIcon}
														/>
													</Show>
													<p class="m-0 text-surface-600 no-underline font-medium">
														{props.manifest.publisherName}
													</p>
												</div>
											</div>
											<div>
												<h3 class="text-surface-400 text-sm mb-1.5">License</h3>
												<p class="m-0 text-surface-600 no-underline font-medium">
													{props?.manifest?.license}
												</p>
											</div>
											<Show
												when={
													// @ts-ignore (Show components are not typed)
													props.manifest.pricing
												}
											>
												<div
													class="cursor-pointer"
													onClick={() => scrollToAnchor("pricing", "smooth")}
												>
													<h3 class="text-surface-400 text-sm mb-2">Pricing</h3>
													<p class="text-surface-600 font-medium">
														{
															// @ts-ignore
															props.manifest.pricing
														}
													</p>
												</div>
											</Show>
										</div>
										<Show when={props.tableOfContents}>
											{/* Classes to be added: sticky z-10 top-16 pt-8 md:pt-0 md:static bg-background */}
											<aside class="col-span-1 md:order-1 -order-1 hidden md:block sticky top-36 mb-32">
												<NavbarCommon
													displayName={displayName}
													getLocale={languageTag}
													tableOfContents={props.tableOfContents}
												/>
											</aside>
										</Show>
									</div>
								</section>
								<div>
									<a
										class="text-info/80 hover:text-info/100 text-sm font-semibold flex items-center"
										href={convertLinkToGithub(readme())}
										target="_blank"
									>
										<EditOutline class="inline-block mr-2" />
										Edit on GitHub
									</a>
								</div>
								<div class="md:col-span-3 md:my-0 my-12">
									<div>
										<h3 class="text-surface-400 text-sm mb-2">Keywords</h3>
										<div class="flex flex-wrap gap-2 items-center">
											<For each={props?.manifest?.keywords}>
												{(keyword) => (
													<Link
														class="transition-opacity hover:opacity-80 cursor-pointer"
														href={"/search?q=" + keyword}
													>
														<Chip text={keyword} color={colorForTypeOf(props.manifest.id)} />
													</Link>
												)}
											</For>
										</div>
									</div>
								</div>
							</Show>
						</div>
						<Show when={props.recommends}>
							<Recommends recommends={props.recommends!} />
						</Show>
						<div class="mt-20">
							<GetHelp text="Do you have questions?" />
						</div>
					</div>
				</Show>
			</MarketplaceLayout>
		</>
	)
}

const EcosystemIncompatibleBadgeBig = () => {
	return (
		<sl-tooltip prop:content="Learn more">
			<Link href="/g/7777asdy" class="flex flex-row gap-2 items-center hover:opacity-70">
				<div class="px-3 gap-1 h-8 rounded-lg bg-surface-200 flex items-center font-medium text-surface-500 text-[16px]">
					Ecosystem Incompatible
				</div>
			</Link>
		</sl-tooltip>
	)
}

export function Recommends(props: { recommends: MarketplaceManifest[] }) {
	return (
		<>
			<h3 class="font-semibold mb-4">Recommended:</h3>
			<div class="flex items-center gap-4 md:flex-row flex-col">
				<For each={props.recommends}>
					{/* @ts-ignore */}
					{(item) => <Card item={item} displayName={item.displayName.en} />}
				</For>
			</div>
		</>
	)
}

function Markdown(props: { markdown: string }) {
	// eslint-disable-next-line solid/no-innerhtml
	return <article class="w-full" innerHTML={props.markdown} />
}

function NavbarCommon(props: {
	getLocale: () => string
	displayName: () => string
	tableOfContents: Record<string, string[]>
}) {
	const [highlightedAnchor, setHighlightedAnchor] = createSignal<string | undefined>("")

	const replaceChars = (str: string) => {
		return str
			.replaceAll(" ", "-")
			.replaceAll("/", "")
			.replace("#", "")
			.replaceAll("(", "")
			.replaceAll(")", "")
			.replaceAll("?", "")
			.replaceAll(".", "")
			.replaceAll("@", "")
			.replaceAll(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, "")
			.replaceAll("✂", "")
			.replaceAll(":", "")
	}

	const isSelected = (heading: string) => {
		if (heading === highlightedAnchor()) {
			return true
		} else {
			return false
		}
	}

	onMount(async () => {
		for (const sectionTitle of Object.keys(props.tableOfContents)) {
			if (
				currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
				replaceChars(sectionTitle.toString().toLowerCase())
			) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				)

				//scrollToAnchor(replaceChars(sectionTitle.toString().toLowerCase()), "smooth")
				setHighlightedAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
			} else {
				for (const heading of props.tableOfContents[sectionTitle]!) {
					if (
						currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
						replaceChars(heading.toString().toLowerCase())
					) {
						/* Wait for all images to load before scrolling to anchor */
						await Promise.all(
							[...document.querySelectorAll("img")].map((img) =>
								img.complete
									? Promise.resolve()
									: new Promise((resolve) => img.addEventListener("load", resolve))
							)
						)

						scrollToAnchor(replaceChars(heading.toString().toLowerCase()), "smooth")
						setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
					}
				}
			}
		}
	})

	return (
		<div class="mb-12 sticky top-36 mt-16 h-[80vh] pb-8 overflow-y-scroll overflow-scrollbar">
			<ul role="list" class="w-full">
				<For each={Object.keys(props.tableOfContents)}>
					{(sectionTitle) => (
						<li>
							<div
								onClick={() => {
									scrollToAnchor(replaceChars(sectionTitle.toString().toLowerCase()), "smooth")
									setHighlightedAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
								}}
								class={
									(isSelected(replaceChars(sectionTitle.toString().toLowerCase()))
										? "text-primary font-semibold "
										: "text-info/80 hover:text-on-background ") +
									"tracking-wide text-sm block w-full font-normal mb-2 cursor-pointer mt-3"
								}
							>
								{sectionTitle.replace("#", "")}
							</div>
							<For each={props.tableOfContents[sectionTitle]}>
								{(heading) => (
									<li>
										<div
											onClick={() => {
												scrollToAnchor(replaceChars(heading.toString().toLowerCase()), "smooth")
												setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
											}}
											class={
												"text-sm cursor-pointer tracking-widem block w-full border-l pl-3 py-1 hover:border-l-info/80 " +
												(highlightedAnchor() === replaceChars(heading.toString().toLowerCase())
													? "font-medium text-on-background border-l-on-background "
													: "text-info/80 hover:text-on-background font-normal border-l-info/20 ")
											}
										>
											{heading.replace("#", "")}
										</div>
									</li>
								)}
							</For>
						</li>
					)}
				</For>
			</ul>
		</div>
	)
}

export function LixBadge() {
	return (
		<svg
			width="100%"
			height="auto"
			viewBox="0 0 172 96"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M90.8537 65L94.8594 72.6278L104.965 55H111.172L98.8509 75.9091L105.342 86.8182H99.1634L94.8594 79.2756L90.6265 86.8182H84.3765L90.8537 75.9091L84.6037 65H90.8537Z"
				fill="currentColor"
			/>
			<path d="M74.8984 86.8182V65H80.9496V86.8182H74.8984Z" fill="currentColor" />
			<path d="M70 55.0654V87.0654H64V55.0654H70Z" fill="currentColor" />
			<path d="M75 55.0654H91V60.0654H75V55.0654Z" fill="currentColor" />
			<path
				d="M156.626 39.3552C154.969 39.3552 153.468 38.9291 152.123 38.0768C150.788 37.2151 149.728 35.9508 148.942 34.2842C148.165 32.608 147.777 30.5531 147.777 28.1194C147.777 25.6194 148.179 23.5408 148.984 21.8836C149.789 20.2169 150.859 18.9717 152.194 18.1478C153.539 17.3145 155.012 16.8978 156.612 16.8978C157.834 16.8978 158.852 17.1062 159.666 17.5228C160.49 17.93 161.153 18.4414 161.655 19.0569C162.166 19.663 162.554 20.2596 162.819 20.8467H163.004V9.90918H169.041V39.0001H163.075V35.5058H162.819C162.535 36.1118 162.133 36.7132 161.612 37.3097C161.101 37.8969 160.433 38.3846 159.609 38.7728C158.795 39.1611 157.801 39.3552 156.626 39.3552ZM158.544 34.5399C159.519 34.5399 160.343 34.2747 161.015 33.7444C161.697 33.2046 162.218 32.4518 162.578 31.4859C162.947 30.52 163.132 29.3883 163.132 28.091C163.132 26.7936 162.952 25.6668 162.592 24.7103C162.232 23.7539 161.712 23.0152 161.03 22.4944C160.348 21.9736 159.519 21.7132 158.544 21.7132C157.55 21.7132 156.712 21.983 156.03 22.5228C155.348 23.0626 154.832 23.8107 154.481 24.7671C154.131 25.7236 153.956 26.8315 153.956 28.091C153.956 29.3599 154.131 30.4821 154.481 31.4575C154.841 32.4234 155.357 33.181 156.03 33.7302C156.712 34.27 157.55 34.5399 158.544 34.5399Z"
				fill="currentColor"
			/>
			<path
				d="M134.623 39.4264C132.379 39.4264 130.447 38.9718 128.828 38.0627C127.218 37.1442 125.978 35.8468 125.106 34.1707C124.235 32.4851 123.8 30.4917 123.8 28.1906C123.8 25.9462 124.235 23.9765 125.106 22.2815C125.978 20.5864 127.204 19.2654 128.785 18.3184C130.376 17.3714 132.242 16.8979 134.382 16.8979C135.821 16.8979 137.161 17.13 138.402 17.594C139.652 18.0485 140.741 18.7351 141.669 19.6536C142.606 20.5722 143.336 21.7275 143.856 23.1195C144.377 24.5021 144.638 26.1214 144.638 27.9775V29.6394H126.214V25.8894H138.942C138.942 25.0182 138.752 24.2464 138.373 23.5741C137.995 22.9017 137.469 22.3762 136.797 21.9974C136.134 21.6091 135.362 21.415 134.481 21.415C133.563 21.415 132.748 21.6281 132.038 22.0542C131.337 22.4709 130.788 23.0343 130.39 23.7445C129.993 24.4453 129.789 25.2265 129.78 26.0883V29.6536C129.78 30.7332 129.979 31.6659 130.376 32.4519C130.783 33.2379 131.356 33.844 132.095 34.2701C132.834 34.6962 133.71 34.9093 134.723 34.9093C135.395 34.9093 136.011 34.8146 136.569 34.6252C137.128 34.4358 137.606 34.1517 138.004 33.7729C138.402 33.3942 138.705 32.9301 138.913 32.3809L144.51 32.7502C144.226 34.0949 143.643 35.2692 142.763 36.2729C141.891 37.2673 140.765 38.0438 139.382 38.6025C138.009 39.1517 136.423 39.4264 134.623 39.4264Z"
				fill="currentColor"
			/>
			<path
				d="M109.329 39.0003V17.1821H115.195V20.9889H115.423C115.82 19.6348 116.488 18.6121 117.425 17.9208C118.363 17.22 119.442 16.8696 120.664 16.8696C120.967 16.8696 121.294 16.8886 121.644 16.9264C121.995 16.9643 122.302 17.0164 122.567 17.0827V22.452C122.283 22.3668 121.89 22.291 121.389 22.2247C120.887 22.1585 120.427 22.1253 120.011 22.1253C119.121 22.1253 118.325 22.3194 117.624 22.7077C116.933 23.0865 116.384 23.6168 115.977 24.2986C115.579 24.9804 115.38 25.7664 115.38 26.6566V39.0003H109.329Z"
				fill="currentColor"
			/>
			<path
				d="M95.3656 39.4264C93.1213 39.4264 91.1895 38.9718 89.5702 38.0627C87.9603 37.1442 86.7198 35.8468 85.8486 34.1707C84.9774 32.4851 84.5417 30.4917 84.5417 28.1906C84.5417 25.9462 84.9774 23.9765 85.8486 22.2815C86.7198 20.5864 87.9461 19.2654 89.5275 18.3184C91.1185 17.3714 92.984 16.8979 95.1241 16.8979C96.5635 16.8979 97.9035 17.13 99.144 17.594C100.394 18.0485 101.483 18.7351 102.411 19.6536C103.349 20.5722 104.078 21.7275 104.599 23.1195C105.119 24.5021 105.38 26.1214 105.38 27.9775V29.6394H86.9565V25.8894H99.6838C99.6838 25.0182 99.4944 24.2464 99.1156 23.5741C98.7368 22.9017 98.2113 22.3762 97.5389 21.9974C96.876 21.6091 96.1043 21.415 95.2236 21.415C94.305 21.415 93.4906 21.6281 92.7804 22.0542C92.0796 22.4709 91.5304 23.0343 91.1327 23.7445C90.7349 24.4453 90.5313 25.2265 90.5219 26.0883V29.6536C90.5219 30.7332 90.7207 31.6659 91.1185 32.4519C91.5257 33.2379 92.0986 33.844 92.8372 34.2701C93.5758 34.6962 94.4518 34.9093 95.465 34.9093C96.1374 34.9093 96.7529 34.8146 97.3116 34.6252C97.8704 34.4358 98.3486 34.1517 98.7463 33.7729C99.144 33.3942 99.4471 32.9301 99.6554 32.3809L105.252 32.7502C104.968 34.0949 104.386 35.2692 103.505 36.2729C102.634 37.2673 101.507 38.0438 100.124 38.6025C98.751 39.1517 97.1649 39.4264 95.3656 39.4264Z"
				fill="currentColor"
			/>
			<path
				d="M56.25 39.0003L50.3125 17.1821H56.4347L59.8153 31.8412H60.0142L63.5369 17.1821H69.5455L73.125 31.756H73.3097L76.6335 17.1821H82.7415L76.8182 39.0003H70.4119L66.6619 25.2787H66.392L62.642 39.0003H56.25Z"
				fill="currentColor"
			/>
			<path
				d="M37.8194 39.4264C35.613 39.4264 33.7049 38.9576 32.095 38.0201C30.4946 37.0731 29.2588 35.7568 28.3876 34.0712C27.5164 32.3762 27.0808 30.4112 27.0808 28.1764C27.0808 25.9226 27.5164 23.9529 28.3876 22.2673C29.2588 20.5722 30.4946 19.2559 32.095 18.3184C33.7049 17.3714 35.613 16.8979 37.8194 16.8979C40.0259 16.8979 41.9293 17.3714 43.5297 18.3184C45.1395 19.2559 46.3801 20.5722 47.2513 22.2673C48.1225 23.9529 48.5581 25.9226 48.5581 28.1764C48.5581 30.4112 48.1225 32.3762 47.2513 34.0712C46.3801 35.7568 45.1395 37.0731 43.5297 38.0201C41.9293 38.9576 40.0259 39.4264 37.8194 39.4264ZM37.8479 34.7389C38.8516 34.7389 39.6897 34.4548 40.3621 33.8866C41.0344 33.3089 41.541 32.5229 41.8819 31.5286C42.2323 30.5343 42.4075 29.4027 42.4075 28.1337C42.4075 26.8648 42.2323 25.7332 41.8819 24.7389C41.541 23.7445 41.0344 22.9586 40.3621 22.3809C39.6897 21.8033 38.8516 21.5144 37.8479 21.5144C36.8346 21.5144 35.9823 21.8033 35.291 22.3809C34.6092 22.9586 34.0931 23.7445 33.7427 24.7389C33.4018 25.7332 33.2314 26.8648 33.2314 28.1337C33.2314 29.4027 33.4018 30.5343 33.7427 31.5286C34.0931 32.5229 34.6092 33.3089 35.291 33.8866C35.9823 34.4548 36.8346 34.7389 37.8479 34.7389Z"
				fill="currentColor"
			/>
			<path
				d="M2.52832 39.0001V9.90918H14.0056C16.212 9.90918 18.0918 10.3306 19.6448 11.1734C21.1978 12.0067 22.3815 13.1668 23.1959 14.6535C24.0198 16.1308 24.4317 17.8353 24.4317 19.7671C24.4317 21.699 24.0151 23.4035 23.1817 24.8808C22.3484 26.358 21.141 27.5086 19.5596 28.3325C17.9876 29.1563 16.0842 29.5683 13.8493 29.5683H6.534V24.6393H12.855C14.0387 24.6393 15.0141 24.4357 15.7812 24.0285C16.5577 23.6118 17.1353 23.0389 17.5141 22.3097C17.9024 21.5711 18.0965 20.7236 18.0965 19.7671C18.0965 18.8012 17.9024 17.9584 17.5141 17.2387C17.1353 16.5096 16.5577 15.9461 15.7812 15.5484C15.0046 15.1412 14.0198 14.9376 12.8266 14.9376H8.67889V39.0001H2.52832Z"
				fill="currentColor"
			/>
			<path
				d="M30.877 95.1821C30.1099 95.1821 29.3902 95.1206 28.7179 94.9975C28.055 94.8838 27.5057 94.7371 27.0701 94.5571L28.4338 90.0401C29.144 90.2579 29.7832 90.3763 30.3514 90.3952C30.929 90.4141 31.4262 90.2816 31.8429 89.9975C32.269 89.7134 32.6146 89.2304 32.8798 88.5486L33.2349 87.6253L25.4082 65.1821H31.7718L36.2889 81.2049H36.5162L41.0758 65.1821H47.4821L39.002 89.3583C38.5948 90.5325 38.0408 91.5552 37.34 92.4264C36.6487 93.3071 35.7728 93.9842 34.7122 94.4577C33.6516 94.9407 32.3732 95.1821 30.877 95.1821Z"
				fill="currentColor"
			/>
			<path
				d="M2.52832 87.0001V57.9092H8.57946V68.8467H8.76412C9.02927 68.2596 9.41279 67.663 9.91468 67.0569C10.426 66.4414 11.0889 65.93 11.9033 65.5228C12.7272 65.1062 13.7499 64.8978 14.9715 64.8978C16.5624 64.8978 18.0302 65.3145 19.3749 66.1478C20.7196 66.9717 21.7944 68.2169 22.5993 69.8836C23.4043 71.5408 23.8067 73.6194 23.8067 76.1194C23.8067 78.5531 23.4137 80.608 22.6278 82.2842C21.8512 83.9508 20.7906 85.2151 19.4459 86.0768C18.1107 86.9291 16.6145 87.3552 14.9573 87.3552C13.7831 87.3552 12.784 87.1611 11.9601 86.7728C11.1457 86.3846 10.4781 85.8969 9.9573 85.3097C9.43646 84.7132 9.03874 84.1118 8.76412 83.5058H8.49423V87.0001H2.52832ZM8.45162 76.091C8.45162 77.3883 8.63154 78.52 8.99139 79.4859C9.35124 80.4518 9.87207 81.2046 10.5539 81.7444C11.2357 82.2747 12.0643 82.5399 13.0397 82.5399C14.0245 82.5399 14.8579 82.27 15.5397 81.7302C16.2215 81.181 16.7376 80.4234 17.088 79.4575C17.4478 78.4821 17.6278 77.3599 17.6278 76.091C17.6278 74.8315 17.4526 73.7236 17.1022 72.7671C16.7518 71.8107 16.2357 71.0626 15.5539 70.5228C14.8721 69.983 14.034 69.7132 13.0397 69.7132C12.0548 69.7132 11.2215 69.9736 10.5397 70.4944C9.86734 71.0152 9.35124 71.7539 8.99139 72.7103C8.63154 73.6668 8.45162 74.7936 8.45162 76.091Z"
				fill="currentColor"
			/>
		</svg>
	)
}
