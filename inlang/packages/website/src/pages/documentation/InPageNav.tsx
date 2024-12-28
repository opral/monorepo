import { currentPageContext } from "#src/renderer/state.js";
import { For, createEffect, createSignal, onMount, Show } from "solid-js";

interface InPageNavProps {
	markdown: Awaited<ReturnType<any>>;
	pageName: string;
}

const InPageNav = (props: InPageNavProps) => {
	const [tableOfContents, setTableOfContents] = createSignal<
		Record<string, Array<string>>
	>({});
	const [highlightedAnchor, setHighlightedAnchor] = createSignal<
		string | undefined
	>("");

	createEffect(() => {
		const table: Record<string, Array<string>> = {};
		if (
			props.markdown &&
			props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g) //&&
			//props.markdown.match(/<h[1].*?>(.*?)<\/h[1]>/g)
		) {
			let lastH1Key = props.pageName;
			table[lastH1Key] = [];

			props.markdown
				.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)
				.map((heading: string) => {
					// We have to use DOMParser to parse the heading string to a HTML element
					const parser = new DOMParser();
					const doc = parser.parseFromString(heading, "text/html");
					const node = doc.body.firstChild as HTMLElement;

					if (node.tagName === "H1") {
						// @ts-ignore
						delete table[lastH1Key];
						table[
							node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", "")
						] = [];
					} else {
						// @ts-ignore
						if (!table[lastH1Key]) {
							const h1Keys = Object.keys(table);
							// @ts-ignore
							lastH1Key = h1Keys.at(-1);
							// @ts-ignore
							table[lastH1Key].push(
								node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", "")
							);
						} else {
							// @ts-ignore
							table[lastH1Key].push(
								node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", "")
							);
						}
					}

					return node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", "");
				});
		}

		setTableOfContents(table);
	});

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
			.replaceAll(":", "");
	};

	const isSelected = (heading: string) => {
		if (heading === highlightedAnchor()) {
			return true;
		} else {
			return false;
		}
	};

	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
		const element = document.getElementById(anchor);
		if (element && window) {
			window.scrollTo({
				top: element.offsetTop - 24,
				behavior: behavior ?? "instant",
			});
		}
		window.history.pushState(
			{},
			"",
			`${currentPageContext.urlParsed.pathname}#${anchor}`
		);
	};

	onMount(async () => {
		for (const sectionTitle of Object.keys(tableOfContents())) {
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
				);

				setHighlightedAnchor(
					replaceChars(sectionTitle.toString().toLowerCase())
				);
			} else {
				for (const heading of tableOfContents()[sectionTitle]!) {
					if (
						currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
						replaceChars(heading.toString().toLowerCase())
					) {
						/* Wait for all images to load before scrolling to anchor */
						await Promise.all(
							[...document.querySelectorAll("img")].map((img) =>
								img.complete
									? Promise.resolve()
									: new Promise((resolve) =>
											img.addEventListener("load", resolve)
										)
							)
						);

						scrollToAnchor(
							replaceChars(heading.toString().toLowerCase()),
							"smooth"
						);
						setHighlightedAnchor(
							replaceChars(heading.toString().toLowerCase())
						);
					}
				}
			}
		}
	});

	return (
		<div>
			<ul role="list" class="w-full space-y-3">
				<Show
					when={Object.values(tableOfContents()).some(
						(array) => array.length > 0
					)}
				>
					<For each={Object.keys(tableOfContents())}>
						{(sectionTitle) => (
							<li>
								<a
									onClick={(e: any) => {
										e.preventDefault();
										scrollToAnchor(
											replaceChars(sectionTitle.toString().toLowerCase()),
											"smooth"
										);
										setHighlightedAnchor(
											replaceChars(sectionTitle.toString().toLowerCase())
										);
									}}
									class={
										(isSelected(
											replaceChars(sectionTitle.toString().toLowerCase())
										)
											? "text-primary font-semibold "
											: "text-surface-900 hover:text-on-background ") +
										"tracking-wide cursor-pointer text-sm block w-full font-normal mb-2"
									}
								>
									{sectionTitle.replace("#", "")}
								</a>
								<For each={tableOfContents()[sectionTitle]}>
									{(heading) => (
										<li>
											<a
												onClick={(e: any) => {
													e.preventDefault();
													scrollToAnchor(
														replaceChars(heading.toString().toLowerCase()),
														"smooth"
													);
													setHighlightedAnchor(
														replaceChars(heading.toString().toLowerCase())
													);
												}}
												class={
													"text-sm cursor-pointer tracking-widem block w-full border-l pl-3 py-1 hover:border-l-info/80 " +
													(highlightedAnchor() ===
													replaceChars(heading.toString().toLowerCase())
														? "font-medium text-on-background border-l-on-background "
														: "text-info/80 hover:text-on-background font-normal border-l-info/20 ")
												}
											>
												{heading.replace("#", "")}
											</a>
										</li>
									)}
								</For>
							</li>
						)}
					</For>
				</Show>
			</ul>
		</div>
	);
};

export default InPageNav;
