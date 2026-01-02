import type { PageContextRenderer } from "#src/renderer/types.js";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";
import MaterialSymbolsArrowBackRounded from "~icons/material-symbols/arrow-back-rounded";
import { Match, Switch } from "solid-js";
import { Title } from "@solidjs/meta";
import Link from "#src/renderer/Link.jsx";

export default function Page(pageContext: PageContextRenderer) {
	return (
		<>
			<Title>inlang Error</Title>
			<div class="min-h-screen flex  items-center justify-center">
				<div class="border border-outline p-8 rounded flex flex-col max-w-lg bg-danger-container gap-4">
					<Switch>
						<Match when={pageContext.is404}>
							<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center" />
							<div class="flex flex-col gap-2">
								<h1 class="font-semibold  ">404</h1>
								<p>Something went wrong, we couldn't find your page.</p>
							</div>

							<Link
								href={
									import.meta.env.PROD
										? "https://inlang.com"
										: "http://localhost:3000"
								}
							>
								<sl-button prop:variant="text">
									{/* @ts-ignore */}
									<MaterialSymbolsArrowBackRounded slot="prefix" />
									Back to inlang.com
								</sl-button>
							</Link>
						</Match>
						<Match when={!pageContext.is404}>
							<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center" />
							<div class="flex flex-col gap-2">
								<h1 class="font-semibold ">Error</h1>
								<p>
									Houston we have a problem. Sincere apologies. Please Try again
									later and report this Bug.
								</p>
							</div>
							<Link
								class="self-end pt-5"
								href="https://github.com/opral/inlang/issues/new/choose"
								target="_blank"
							>
								<sl-button prop:variant="text">
									Report a Bug
									{/* @ts-ignore */}
									<MaterialSymbolsArrowOutwardRounded slot="suffix" />
								</sl-button>
							</Link>
						</Match>
					</Switch>
				</div>
			</div>
		</>
	);
}
