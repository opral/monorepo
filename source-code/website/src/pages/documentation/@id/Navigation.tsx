import { currentPageContext } from "@src/renderer/state.js";
import { For } from "solid-js";
import { tableOfContents } from "./tableOfContents.js";
export function Navigation() {
	return (
		<>
			{/* desktop navbar */}
			<nav class="hidden md:block sticky top-[3.5rem] h-[calc(100vh-4.5rem)] overflow-y-auto w-full">
				<Common></Common>
			</nav>
			{/* Mobile navbar */}

			<nav class="sm:hidden overflow-y-auto overflow-auto min-w-full">
				<sl-details>
					<h3 slot="summary" class="font-medium">
						Menu
					</h3>
					<Common></Common>
				</sl-details>
			</nav>
		</>
	);
}
function Common() {
	return (
		<ul role="list" class="divide-y divide-outline pr-4 min-h-full">
			<For each={tableOfContents}>
				{(section) => (
					<li class="py-3">
						<h2 class="font-bold text-on-surface pb-3">{section.title}</h2>
						<ul class="space-y-1.5" role="list">
							<For each={section.documents}>
								{(document) => (
									<li>
										<a
											class="block w-full font-medium link link-primary"
											classList={{
												"text-primary":
													document.href ===
													currentPageContext().urlParsed.pathname,
												"text-on-surface-variant":
													document.href !==
													currentPageContext().urlParsed.pathname,
											}}
											href={document.href}
										>
											{document.title}
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
