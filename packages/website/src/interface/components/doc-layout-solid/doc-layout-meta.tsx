import Link from "#src/renderer/Link.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import type { MarketplaceManifest } from "@inlang/marketplace-manifest";
import { Show, createEffect, createSignal, onMount, onCleanup, For } from "solid-js";
// import MaterialSymbolsWarningOutlineRounded from "~icons/material-symbols/warning-outline-rounded"
import { Chip } from "../Chip.jsx";
import { getGithubLink } from "#src/pages/m/helper/getGithubLink.js";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";

type Headlines = {
	level: "H1" | "H2" | "H3";
	anchor: string;
	element: Element;
}[];

const InlangDocMeta = (props: {
	manifest: MarketplaceManifest & { uniqueID: string };
	contentInHtml: HTMLCollection;
	currentRoute: string;
}) => {
	const [headlines, setHeadlines] = createSignal<Headlines>([]);
	
	const githubLink = () => getGithubLink(props.manifest, props.currentRoute);

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
			.replaceAll(
				/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
				""
			)
			.replaceAll("✂", "")
			.replaceAll(":", "")
			.replaceAll("'", "");
	};

	const findHeadlineElements = (elements: HTMLCollection) => {
		const myHeadlines: Headlines = [];
		if (!elements || elements.length === 0) {
			return myHeadlines;
		}
		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			// Check if the element is an h1 or h2
			if (
				element &&
				element.textContent &&
				(element.tagName === "H1" ||
					element.tagName === "H2" ||
					element.tagName === "H3")
			) {
				// Add the element to the headers array
				const id = replaceChars(element.textContent.toLowerCase());
				myHeadlines.push({
					level: element.tagName,
					anchor: id,
					element: element,
				});
			}
		}

		// Return the array of h1 and h2 elements
		return myHeadlines;
	};

	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
		const element = document.getElementById(anchor);
		if (element && window) {
			window.scrollTo({
				top: element.offsetTop - 210,
				behavior: behavior ?? "instant",
			});
		}
		window.history.pushState(
			{},
			"",
			`${currentPageContext.urlParsed.pathname}${
				currentPageContext.urlParsed.search.view
					? `?view=${currentPageContext.urlParsed.search.view}`
					: ""
			}#${anchor}`
		);
	};

	createEffect(() => {
		if (props.currentRoute) {
			setTimeout(() => {
				setHeadlines([]);
				setHeadlines(findHeadlineElements(props.contentInHtml));
			});
		}
	});


	onMount(async () => {
		setHeadlines(findHeadlineElements(props.contentInHtml));

		for (const sectionTitle of headlines()) {
			if (
				currentPageContext.urlParsed.hash.toString() ===
				replaceChars(sectionTitle.anchor)
			) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				);
				setTimeout(() => {
					scrollToAnchor(sectionTitle.anchor, "smooth");
				}, 100);
			}
		}
	});

	return (
		<div class="text-sm pt-12 flex flex-col gap-[4px]">
			<p class="text-surface-400 pb-1 uppercase text-[12px]">Author</p>
			<Link href={props.manifest.publisherLink}>
				<div
					class={`flex items-center gap-2 ${
						props.manifest.publisherLink && "hover:text-primary cursor-pointer"
					}`}
				>
					<Show when={props.manifest.publisherIcon}>
						<img
							class="w-7 h-7 rounded-full"
							src={props.manifest.publisherIcon}
							alt="publisher icon"
						/>
					</Show>
					<p class="font-semibold">{props.manifest.publisherName}</p>
				</div>
			</Link>

			<div class="w-full h-[1px] bg-surface-200 my-4" />
			<p class="text-surface-400 pb-1 uppercase text-[12px]">
				Meta information
			</p>
			{/* <Link
				href="/g/7777asdy/guide-nilsjacobsen-ecosystemCompatible"
				class="flex items-center gap-2 text-surface-600 hover:text-primary cursor-pointer"
			>
				<div class="w-7 h-7 flex items-center justify-center">
					<Show
						when={
							props.manifest.keywords
								.map((keyword: string) => keyword.toLowerCase())
								.includes("inlang") ||
							!props.manifest.id.includes("app") ||
							props.manifest.id.includes("parrot")
						}
						fallback={<MaterialSymbolsWarningOutlineRounded class="w-5 h-5 text-warning" />}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" fill="none" viewBox="0 0 48 33">
							<path
								fill="currentColor"
								d="M26.854 10l4.005 7.628L40.964 0h6.208L34.85 20.91l6.491 10.908h-6.179l-4.304-7.542-4.233 7.542h-6.25l6.478-10.909L20.604 10h6.25zM10.898 31.818V10h6.052v21.818h-6.052zM6 .065v32H0v-32h6zM11 .065h16v5H11v-5z"
							/>
						</svg>
					</Show>
				</div>
				<p class="flex-1">
					{props.manifest.keywords
						.map((keyword: string) => keyword.toLowerCase())
						.includes("inlang") ||
					!props.manifest.id.includes("app") ||
					props.manifest.id.includes("parrot")
						? "Powered by Lix"
						: "Ecosystem incompatible"}
				</p>
			</Link> */}
			<div class="flex items-center gap-2 text-surface-600">
				<div class="w-7 h-7 flex items-center justify-center">
					<svg
						width="20"
						height="20"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9.99935 2.66927H3.99935V13.3359H11.9993V4.66927H9.99935V2.66927ZM3.99935 1.33594H10.666L13.3327 4.0026V13.3359C13.3327 13.6896 13.1922 14.0287 12.9422 14.2787C12.6921 14.5288 12.353 14.6693 11.9993 14.6693H3.99935C3.64573 14.6693 3.30659 14.5288 3.05654 14.2787C2.80649 14.0287 2.66602 13.6896 2.66602 13.3359V2.66927C2.66602 2.31565 2.80649 1.97651 3.05654 1.72646C3.30659 1.47641 3.64573 1.33594 3.99935 1.33594ZM5.33268 7.33594H10.666V8.66927H5.33268V7.33594ZM5.33268 10.0026H10.666V11.3359H5.33268V10.0026Z"
							fill="currentColor"
						/>
					</svg>
				</div>
				<p class="flex-1">{props.manifest.license}</p>
			</div>
			<Show when={props.manifest.pricing}>
				<div
					onClick={(e) => {
						// Prevent scroll if text is selected
						const selection = window.getSelection();
						if (selection && selection.toString().length > 0) {
							e.preventDefault();
							e.stopPropagation();
							return;
						}
						if (
							headlines() &&
							headlines().some((h) => h.anchor === "pricing")
						) {
							scrollToAnchor("pricing", "smooth");
						}
					}}
					class={`flex items-center gap-2 text-surface-600 ${
						headlines().some((h) => h.anchor === "pricing") &&
						"hover:text-primary cursor-pointer"
					}`}
				>
					<div class="w-7 h-7 flex items-center justify-center">
						<svg
							width="20"
							height="20"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M7.24583 14.9578V13.2953C6.56279 13.1406 5.9733 12.8442 5.47738 12.406C4.98147 11.9678 4.61726 11.3492 4.38477 10.5502L5.8153 9.97024C6.00862 10.5888 6.2955 11.0593 6.67594 11.3814C7.05639 11.7036 7.55566 11.8647 8.17375 11.8647C8.70215 11.8647 9.15012 11.7456 9.51768 11.5075C9.88524 11.2693 10.0688 10.8987 10.0682 10.3955C10.0682 9.94446 9.92648 9.58696 9.64295 9.32302C9.35942 9.05908 8.70215 8.75931 7.67113 8.42372C6.56279 8.07575 5.80241 7.66025 5.39001 7.17722C4.9776 6.69419 4.7714 6.10444 4.7714 5.40799C4.7714 4.57029 5.04204 3.91946 5.58332 3.45551C6.12461 2.99155 6.67878 2.72735 7.24583 2.66291V1.03906H8.79236V2.66291C9.43674 2.76601 9.96849 3.00134 10.3876 3.3689C10.8067 3.73646 11.1127 4.18418 11.3055 4.71206L9.87493 5.33067C9.72027 4.91826 9.50118 4.60896 9.21765 4.40275C8.93412 4.19655 8.54749 4.09345 8.05776 4.09345C7.4907 4.09345 7.05896 4.21923 6.76255 4.4708C6.46613 4.72237 6.31792 5.03477 6.31792 5.40799C6.31792 5.83329 6.51124 6.16837 6.89787 6.41323C7.2845 6.6581 7.95466 6.91585 8.90835 7.1865C9.7976 7.44425 10.4711 7.85356 10.9289 8.41444C11.3867 8.97531 11.6153 9.62279 11.6148 10.3569C11.6148 11.2719 11.3441 11.9678 10.8028 12.4447C10.2616 12.9215 9.5914 13.2179 8.79236 13.3339V14.9578H7.24583Z"
								fill="currentColor"
							/>
						</svg>
					</div>
					<p class="flex-1">{props.manifest.pricing}</p>
				</div>
			</Show>
			<div class="w-full h-[1px] bg-surface-200 my-4" />

			<div>
				<p class="text-surface-400 uppercase text-[12px] pb-3">Keywords</p>
				<div class="flex flex-wrap gap-2 items-center">
					<For each={props?.manifest?.keywords}>
						{(keyword) => (
							<Link
								class="transition-opacity hover:opacity-80 cursor-pointer"
								href={"/search?q=" + keyword}
							>
								<Chip text={keyword} color={"#475569"} />
							</Link>
						)}
					</For>
				</div>
			</div>

			<div class="w-full h-[1px] bg-surface-200 my-4" />
			<Show when={githubLink()}>
				<a
					href={githubLink()}
					target="_blank"
					class={`hover:text-primary flex items-center gap-[6px] text-surface-600 cursor-pointer`}
				>
					<p class="text-sm py-[5px]">Edit this page on Github</p>
					<MaterialSymbolsArrowOutwardRounded />
				</a>
			</Show>

			<Show when={headlines() && headlines()![0]}>
				<button
					type="button"
					class={`hover:text-primary flex items-center gap-[6px] text-surface-600 cursor-pointer bg-transparent border-none p-0 font-inherit`}
					onClick={(e) => {
						// Prevent scroll if text is selected
						const selection = window.getSelection();
						if (selection && selection.toString().length > 0) {
							e.preventDefault();
							e.stopPropagation();
							return;
						}
						// Double-check we're not in the middle of a drag
						if (e.detail === 0) {
							// This is a programmatic click, ignore it
							return;
						}
						scrollToAnchor(headlines()![0]!.anchor, "smooth");
					}}
				>
					<p class="text-sm py-[5px]">Scroll to top</p>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M11 16h2v-4.2l1.6 1.6L16 12l-4-4l-4 4l1.4 1.4l1.6-1.6zm1 6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
						/>
					</svg>
				</button>
			</Show>
		</div>
	);
};

export default InlangDocMeta;
