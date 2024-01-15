import LintRulesSection from "./LintRules.jsx"
import PluginSection from "./Plugins.jsx"

const ExtendSection = () => {
	return (
		<div class="pt-12 md:pt-20 flex flex-col items-center">
			<p class="bg-background px-4 py-1.5 rounded-full text-sm font-medium w-fit border shadow border-surface-300">
				Plug and Play
			</p>
			<h2 class="font-bold text-2xl md:text-4xl text-surface-900 text-center mt-5">
				Extend your Apps
			</h2>
			<p class="text-center text-lg max-w-[500px] text-surface-500 pt-5">
				Enhance your app experience with plugins and lint rules, seamlessly adapting to your project
				needs.
			</p>
			<div class="flex flex-col gap-10 mt-10 w-full">
				<PluginSection />
				<LintRulesSection />
			</div>
		</div>
	)
}

export default ExtendSection
