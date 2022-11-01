import { currentPageContext } from "@src/renderer/state.js";
import { createSignal, For, Switch, Match } from "solid-js";

export function Navigation(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	return (
		<nav class="text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16 bg-surface-100">
			<div> ich könnte mal eine Suche werden</div>
			<hr class="border-b-2"></hr>
			<ul
				role="list"
				// class="space-y-9 h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden pl-0.5 pb-16  mb-8  "

				class={`h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden lg:block fixed   text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16 pb-10 `}
			>
				<For each={props.sections}>
					{(section) => (
						<>
							<div
								class=" pt-4 
							 lg:pb-2 lg:pt-6 "
							>
								<Switch
									fallback={
										<>
											<hr
												class="pb-1  border-t-2
							  "
											></hr>
										</>
									}
								>
									<Match when={section.title == "Introduction"}>
										<></>
									</Match>
								</Switch>

								<h2 class="font-display font-medium text-slate-900  ">
									{section.title}
								</h2>
							</div>
							<ul
								role="list"
								// class="mt-2 space-y-2 border-l-2 border-slate-100  lg:mt-4 lg:space-y-4 lg:border-slate-200"
							>
								<For each={section.documents}>
									{(document) => (
										<>
											<li class="relative">
												<a
													class={`${
														document.href === currentPageContext()?.urlPathname
															? " text-on-surface"
															: " text-slate-500"
														// ? "font-semibold text-sky-500 before:bg-sky-500"
														// : "text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block "
													}
													link link-primary
														`}
													// block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full

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
