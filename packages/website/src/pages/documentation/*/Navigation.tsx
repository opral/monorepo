import { currentPageContext } from "@src/renderer/state.js";
import { For } from "solid-js";
import type { PageProps } from "./index.page.jsx";

export function Navigation(props: {
	processedTableOfContents: PageProps["processedTableOfContents"];
}) {
	return (
		<>
			{/* desktop navbar */}
			<nav class="hidden md:block sticky top-[3.5rem] overflow-y-auto w-full">
				<Common {...props}></Common>
			</nav>
			{/* Mobile navbar */}
			<nav class="sm:hidden overflow-y-auto overflow-auto min-w-full">
				<sl-details>
					<h3 slot="summary" class="font-medium">
						Menu
					</h3>
					<Common {...props}></Common>
				</sl-details>
			</nav>
		</>
	);
}
function Common(props: {
	processedTableOfContents: PageProps["processedTableOfContents"];
}) {
	return (
		<ul role="list" class="divide-y divide-outline min-h-full bg-surface-2 p-5">
			<For each={Object.keys(props.processedTableOfContents)}>
				{(section) => (
					<li class="py-3">
						<h2 class="font-bold text-on-surface pb-3">{section}</h2>
						<ul class="space-y-1.5" role="list">
							<For
								each={
									props.processedTableOfContents[
										section as keyof typeof props.processedTableOfContents
									]
								}
							>
								{(document) => (
									<li>
										<a
											class="block w-full font-medium link link-primary"
											classList={{
												"text-primary":
													document.frontmatter.href ===
													currentPageContext().urlParsed.pathname,
												"text-on-surface-variant":
													document.frontmatter.href !==
													currentPageContext().urlParsed.pathname,
											}}
											href={document.frontmatter.href}
										>
											{document.frontmatter.title}
										</a>
									</li>
								)}
							</For>
						</ul>
					</li>
				)}
			</For>
		</ul>
	);
}
