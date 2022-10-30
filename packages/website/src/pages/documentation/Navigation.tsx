import { currentPageContext } from "@src/renderer/state.js";
import { createSignal, For } from "solid-js";

export function Navigation(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	return (
		<nav class="text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16">
			<ul
				role="list"
				class={`hidden lg:block fixed z-20 inset-0 top-[3.8125rem] left-[max(0px,calc(50%-45rem))] right-auto w-[19.5rem] pb-10 px-8 overflow-y-auto" `}
			>
				<For each={props.sections}>
					{(section) => (
						<>
							<h2
								class="font-display font-medium text-slate-900 py-2 border-t-2
							 lg:py-4 "
							>
								{section.title}
							</h2>
							<ul
								role="list"
								class="mt-2 space-y-2 border-l-2 border-slate-100  lg:mt-4 lg:space-y-4 lg:border-slate-200"
							>
								<For each={section.documents}>
									{(document) => (
										<>
											<li class="relative">
												<a
													class={
														document.href === currentPageContext()?.urlPathname
															? "font-semibold text-sky-500 before:bg-sky-500"
															: "text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block "
													}
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
