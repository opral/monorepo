import { getDocsBaseUrl } from "#src/interface/sdkDocs/SdkDocsHeader.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import { Match, Switch } from "solid-js";
import TemplateIcon from "./icons/Template.jsx";
import MarketplaceIcon from "./icons/Marketplace.jsx";
import VideoIcon from "./icons/Video.jsx";

const MainActions = () => {
	return (
		<div>
			<Switch>
				<Match
					when={
						getDocsBaseUrl(currentPageContext.urlParsed.pathname) ===
						"/documentation"
					}
				>
					<div class="pb-8 flex flex-col gap-3">
						<a
							href="/c/apps"
							class="flex gap-3 items-center text-surface-700 hover:opacity-80 transition-colors"
						>
							<div class="w-7 h-7 flex justify-center items-center border border-surface-300 rounded-lg">
								<MarketplaceIcon />
							</div>
							<p class="text-sm">Apps on Marketplace</p>
						</a>
					</div>
				</Match>
				<Match
					when={
						getDocsBaseUrl(currentPageContext.urlParsed.pathname) ===
						"/documentation/plugin"
					}
				>
					<div class="pb-8 flex flex-col gap-3">
						<a
							href="/c/plugins"
							class="flex gap-3 items-center text-surface-700 hover:opacity-80 transition-colors"
						>
							<div class="w-7 h-7 flex justify-center items-center border border-surface-300 rounded-lg">
								<MarketplaceIcon />
							</div>
							<p class="text-sm">On Marketplace</p>
						</a>
						<a
							href="https://github.com/opral/monorepo/tree/main/inlang/packages/plugins"
							target="_blanc"
							class="flex gap-3 items-center text-surface-700 hover:opacity-80 transition-colors"
						>
							<div class="w-7 h-7 flex justify-center items-center border border-surface-300 rounded-lg">
								<TemplateIcon />
							</div>
							<p class="text-sm">Templates</p>
						</a>
					</div>
				</Match>
				<Match
					when={
						getDocsBaseUrl(currentPageContext.urlParsed.pathname) ===
						"/documentation/lint-rule"
					}
				>
					<div class="pb-8 flex flex-col gap-3">
						<a
							href="/c/lint-rules"
							class="flex gap-3 items-center text-surface-700 hover:opacity-80 transition-colors"
						>
							<div class="w-7 h-7 flex justify-center items-center border border-surface-300 rounded-lg">
								<MarketplaceIcon />
							</div>
							<p class="text-sm">On Marketplace</p>
						</a>
						<a
							href="https://github.com/opral/monorepo/tree/main/inlang/packages/message-lint-rules"
							target="_blanc"
							class="flex gap-3 items-center text-surface-700 hover:opacity-80 transition-colors"
						>
							<div class="w-7 h-7 flex justify-center items-center border border-surface-300 rounded-lg">
								<TemplateIcon />
							</div>
							<p class="text-sm">Templates</p>
						</a>
						<a
							href="https://www.youtube.com/watch?v=MW9LjRghSWg"
							target="_blanc"
							class="flex gap-3 items-center text-surface-700 hover:opacity-80 transition-colors"
						>
							<div class="w-7 h-7 flex justify-center items-center border border-surface-300 rounded-lg">
								<VideoIcon />
							</div>
							<p class="text-sm">Video Tutorial</p>
						</a>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default MainActions;
