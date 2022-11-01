import { currentPageContext } from "@src/renderer/state.js";
import { createSignal, For } from "solid-js";

export function Navigation(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	// TODO remove the first line in the navigation Bar above the first instruction
	return (
		<nav class="text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16">
			<ul
				role="list"
				class={`hidden lg:block fixed   text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16		 pb-10 px-8 overflow-y-auto" `}
			>
				<For each={props.sections}>
					{(section) => (
						<>
							<div
								class=" pt-4 
							 lg:pb-2 lg:pt-6 "
							>
								<hr
									class="pb-1  border-t-2
							  "
								></hr>
								<h2 class="font-display font-medium text-slate-900  ">
									{section.title}
								</h2>
							</div>
							<ul
								role="list"
								class="mt-2 space-y-2 border-l-2 border-slate-100  lg:mt-4 lg:space-y-4 lg:border-slate-200"
							>
								<For each={section.documents}>
									{(document) => (
										<>
											<li class="relative">
												<a
													class={`${
														document.href === currentPageContext()?.urlPathname
															? "font-semibold text-sky-500 before:bg-sky-500"
															: "text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block "
													}
														
														block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full
														`}
													href={document.href}
												>
													{document.title}
												</a>
											</li>
										</>
									)}
								</For>
							</ul>
						</>
					)}
				</For>
			</ul>
		</nav>
	);
}
