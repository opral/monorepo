import LintRulesSection from "./LintRules.jsx";
import PluginSection from "./Plugins.jsx";
import * as m from "#src/paraglide/messages.js";

const ExtendSection = () => {
	return (
		<div class="pt-12 md:pt-20 flex flex-col items-center">
			<p class="bg-background px-4 py-1.5 rounded-full text-sm font-medium w-fit border shadow border-surface-300">
				{m.home_extend_tag()}
			</p>
			<h2 class="font-bold text-2xl md:text-4xl text-surface-900 text-center mt-5">
				{m.home_extend_title()}
			</h2>
			<p class="text-center text-lg max-w-[500px] text-surface-500 pt-5">
				{m.home_extend_description()}
			</p>
			<div class="flex flex-col gap-10 mt-10 w-full">
				<PluginSection />
				<LintRulesSection />
			</div>
		</div>
	);
};

export default ExtendSection;
