import { currentPageContext } from "@src/renderer/state.js";
import { For, Switch, Match } from "solid-js";

export function Navigation(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	return (
		<div class="sticky top-[4.5rem] -ml-0.5 h-[calc(100vh-4.5rem)] overflow-y-auto bg-surface-500 overflow-x-hidden   pl-0.5 md:block	hidden">
			<nav class=" text-sm w-64  xl:w-72 px-8 pb-8 ">
				{/* <div class="fixed border-b-2 "> ich könnte mal eine Suche werden</div> */}
				<ul role="list" class={``}>
					<For each={props.sections}>
						{(section) => (
							<>
								<div class=" font-display font-medium  mt-6	">
									<Switch
										fallback={
											<>
												<hr class="pt-2.5 border-t border-outline-variant"></hr>
											</>
										}
									>
										<Match when={section.title == "Introduction"}>
											<></>
										</Match>
									</Switch>

									<h2 class="font-display font-bold  py-1.5 ">
										{section.title}
									</h2>
								</div>
								<ul
									role="list"
									class=""
									// class="mt-2 space-y-2 border-l-2 border-slate-100  lg:mt-4 lg:space-y-4 lg:border-slate-200"
								>
									<For each={section.documents}>
										{(document) => (
											<>
												<li class="relative ">
													<a
														class={`${
															document.href ===
															currentPageContext()?.urlParsed.pathname
																? // TODO Change Color
																  " text-primary "
																: " text-on-surface/60"
															// ? "font-semibold text-sky-500 before:bg-sky-500"
															// : "text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block "
														}
															block w-full font-medium  my-2
															link link-primary 
																`}
														href={document.href}
													>
														<span class="	">{document.title}</span>
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
		</div>
	);
}
