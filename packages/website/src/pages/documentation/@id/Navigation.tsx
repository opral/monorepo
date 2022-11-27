import { currentPageContext } from "@src/renderer/state.js";
import { For } from "solid-js";

export function Navigation(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	return (
		<nav class="sticky top-[3.5rem] h-[calc(100vh-4.5rem)] overflow-y-auto  md:block	hidden">
			<ul role="list" class="divide-y divide-outline pr-4 min-h-full">
				<For each={props.sections}>
					{(section) => (
						<li class="py-3">
							<h2 class="font-bold text-on-surface pb-3">{section.title}</h2>
							<ul class="space-y-1.5" role="list">
								<For each={section.documents}>
									{(document) => (
										<li>
											<a
												classList={{
													"text-primary":
														document.href ===
														currentPageContext().urlParsed.pathname,
												}}
												class="block w-full font-medium text-on-surface-variant link link-primary"
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
		</nav>
	);
}
