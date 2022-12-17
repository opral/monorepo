import { currentPageContext } from "@src/renderer/state.js";
import { createSignal, For, Show } from "solid-js";

export function MobileNav(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	const [isOpen, setIsOpen] = createSignal(false);

	return (
		<nav class="sm:hidden bg-background overflow-y-auto overflow-auto drop-shadow-lg  min-w-full ">
			{/* <div class=" md:hidden flex items-center">
				<button
					onClick={() => IsOpen(!IsOpen())}
					type="button"
					class="inline-flex items-center justify-center text-primary "
				>
					<span class="sr-only">
						{mobileMenuIsOpen() ? "Close menu" : "Open menu"}
					</span>
					{mobileMenuIsOpen() ? (
						<div class="w-6 h-6">zu</div>
					) : (
						<div class="w-6 h-6">Menu</div>
					)}
				</button>
			</div> */}
			<sl-details
				on:sl-show={() => setIsOpen(true)}
				on:sl-after-hide={() => setIsOpen(false)}
			>
				<h3 slot="summary" class="font-medium">
					docs
				</h3>
				<sl-tree>
					<For each={props.sections}>
						{(section) => (
							<sl-tree-item>
								<h2 class="font-bold text-on-surface pb-3">{section.title}</h2>
								<sl-tree-item>
									<ul class="space-y-1.5" role="list">
										<For each={section.documents}>
											{(document) => (
												<div onClick={() => setIsOpen(true)}>
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
												</div>
											)}
										</For>
									</ul>
								</sl-tree-item>
							</sl-tree-item>
						)}
					</For>
				</sl-tree>
			</sl-details>
		</nav>
	);
}
