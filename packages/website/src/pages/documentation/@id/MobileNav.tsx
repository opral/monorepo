import { currentPageContext } from "@src/renderer/state.js";
import { createSignal, For, Show } from "solid-js";
import { navigate } from "vite-plugin-ssr/client/router";

export function MobileNav(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	const [isOpen, setIsOpen] = createSignal(true);
	let detailHide: any;

	return (
		<nav class="sm:hidden bg-background overflow-y-auto overflow-auto drop-shadow-lg min-w-full">
			<sl-details ref={detailHide}>
				<h3 slot="summary" class="font-medium">
					docs
				</h3>
				<sl-tree>
					<For each={props.sections}>
						{(section) => (
							<sl-tree-item>
								<h2 class="font-bold text-on-surface pb-3">{section.title}</h2>

								<For each={section.documents}>
									{(document) => (
										<sl-tree-item
											onClick={() => {
												navigate(document.href), detailHide.hide();
											}}
										>
											<p
												class="block w-full font-medium link link-primary flex-row"
												classList={{
													"text-primary":
														document.href ===
														currentPageContext().urlParsed.pathname,
													"text-on-surface-variant":
														document.href !==
														currentPageContext().urlParsed.pathname,
												}}
											>
												{document.title}
											</p>
										</sl-tree-item>
									)}
								</For>
							</sl-tree-item>
						)}
					</For>
				</sl-tree>
			</sl-details>
		</nav>
	);
}
