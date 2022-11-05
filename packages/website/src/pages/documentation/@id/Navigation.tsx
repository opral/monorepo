import { currentPageContext } from "@src/renderer/state.js";
import { createSignal, For, Switch, Match } from "solid-js";

export function Navigation(props: {
	sections: Array<{
		title: string;
		documents: Array<{ href: string; title: string }>;
	}>;
}) {
	return (
		<nav class="text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16 bg-surface-100 px-4 sm:px-6 lg:px-8">
			{/* <div class="fixed border-b-2 "> ich könnte mal eine Suche werden</div> */}

			<ul
				role="list"
				class={`
				fixed calc((100% - (var(--vp-layout-max-width) - 64px)) / 2 + var(--vp-sidebar-width) - 32px
				pacity-0 overflow-y-auto overflow-x-hidden px-8 pt-8 pb-24  bottom-0 left-0;
	z-index: var(--vp-z-index-sidebar);
	width: calc(100vw - 64px);
	max-width: 320px;
	box-shadow: var(--vp-c-shadow-3);
`}
			>
				{/* 
				
  
				
				top: var(--vp-layout-top-height, 0px);
				bottom: 0;
				left: 0;
				z-index: var(--vp-z-index-sidebar);
				padding: 32px 32px 96px;
				width: calc(100vw - 64px);
				max-width: 320px;
				background-color: var(--vp-c-bg);
				opacity: 0;
				box-shadow: var(--vp-c-shadow-3);
				overflow-x: hidden;
				overflow-y: auto;
				transform: translate(-100%);
				transition: opacity .5s,transform .25s ease;
				
				
				h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden lg:block fixed   text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16 pb-10  */}
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
											<hr class="pb-1  border-t-2"></hr>
										</>
									}
								>
									<Match when={section.title == "Introduction"}>
										<></>
									</Match>
								</Switch>

								<h2 class="font-display   font-bold text-slate-900  ">
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
															: " text-on-surface/80"
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
