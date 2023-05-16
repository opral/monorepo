import { For } from "solid-js"
import { SectionLayout } from "../../components/sectionLayout.jsx"

const code = [
	<p class="text-surface-500">...</p>,
	<p>
		<span class="text-primary-on-inverted-container">plugins</span>: [
	</p>,
	<p>
		<span class="text-primary-on-inverted-container">{"\tjsonPlugin"}</span>
		{"({ "}
	</p>,
	<p>
		<span class="text-primary-on-inverted-container">{"\t\tpathPattern"}</span>
		{": "}
		<span class="text-surface-400">{"'./resources/{language}.json'"}</span>
		{","}
	</p>,
	<p>{"\t}),"}</p>,
	<p>
		<span class="text-primary-on-inverted-container">{"\tideExtensionPlugin"}</span>
		{"()"}
	</p>,
	<p>]</p>,
]

const ConfigPage = () => {
	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="flex flex-col items-center gap-8 py-20 overflow-hidden">
				<h2 class="text-center text-3xl font-semibold text-on-background w-1/2 leading-relaxed tracking-tight">
					The <span class="text-surface-600 bg-surface-200 px-2 py-1 rounded-md">config</span> as a
					bridge between <span class="text-primary">you</span> and{" "}
					<span class="text-primary">inlang's infrastructure</span>
				</h2>
				<div class="relative flex flex-col gap-2 bg-gradient-to-b from-inverted-surface to-surface-700 text-on-inverted-surface py-3 rounded-lg shadow-lg">
					<div class="absolute top-5 left-6 flex gap-2">
						<div class="w-3 h-3 bg-surface-600 rounded-full" />
						<div class="w-3 h-3 bg-surface-600 rounded-full" />
						<div class="w-3 h-3 bg-surface-600 rounded-full" />
					</div>
					<pre class="text-surface-400 w-full text-center">inlang.config.js</pre>
					<div class="flex flex-col gap-1 px-8 py-4 pr-16">
						<For each={code}>
							{(line, index) => (
								<div class="flex gap-8 items-center text-sm">
									<pre class="text-xs text-surface-500">{index()}</pre>
									<pre>{line}</pre>
								</div>
							)}
						</For>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default ConfigPage
