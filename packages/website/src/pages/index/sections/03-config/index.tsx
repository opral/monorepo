import { For, Show, createSignal, onMount } from "solid-js"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import SVGConnector from "./assets/connector.jsx"

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

const data = [
	{
		title: "Web Editor",
		isSoon: false,
		description:
			"Simplifies translation management by keeping translations in a Git repository without the need for hosting, additional accounts, or synchronization.",
		link: "/docs/plugins/jsonPlugin",
		image: "/images/AppSVGs/editor.svg",
	},
	{
		title: "IDE Extension",
		isSoon: false,
		description:
			"Improves developer experience when working on localized codebases by extracting translations and performing error checking directly in your IDE. This saves time and reduces the risk of errors.",
		link: "/docs/plugins/jsonPlugin",
		image: "/images/AppSVGs/ide.svg",
	},
	{
		title: "inlang CLI",
		isSoon: true,
		description:
			"Automates localization via CI/CD through translation validation and automatic machine translation. This saves time and reduces errors, resulting in a more efficient localization process.",
		link: "/docs/plugins/jsonPlugin",
		image: "/images/AppSVGs/cli.svg",
	},
]

const ConfigPage = () => {
	const [connectorSizes, setConnectorSizes] = createSignal<Array<number>>([0, 0, 0])
	onMount(() => {
		const box1 = document.getElementById("connector1")
		const box2 = document.getElementById("connector2")
		const box3 = document.getElementById("connector3")
		setConnectorSizes([box1?.offsetWidth || 0, box2?.offsetWidth || 0, box3?.offsetWidth || 0])
	})

	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="flex flex-col items-center gap-8 pt-20">
				<h2 class="text-center text-3xl font-semibold text-on-background w-1/2 leading-relaxed tracking-tight">
					The <span class="text-surface-600 bg-surface-200 px-2 py-1 rounded-md">config</span> as a
					bridge between <span class="text-primary">you</span> and{" "}
					<span class="text-primary">inlang's infrastructure</span>
				</h2>
				<div
					class="relative flex flex-col gap-2 bg-gradient-to-b from-inverted-surface to-surface-700 text-on-inverted-surface py-3 rounded-lg shadow-lg"
					style={{ "box-shadow": "0px 100px 100px 70px #fafafa" }}
				>
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
			<div class="z-10 relative flex justify-center px-10 gap-20 overflow-hidden transition-all duration-200">
				<div id="connector1" class="w-[calc(100%_/_2_-_80px_-_((100%_-_80px)_/_3)_/_2)]">
					<div class={"translate-x-[" + connectorSizes()[0] + "] -scale-x-100"}>
						<SVGConnector
							width={connectorSizes()[0] || 0}
							height={100}
							radius={24}
							startColor="#06B6D4"
							endColor="#06B6D4"
						/>
					</div>
				</div>
				<div id="connector2" class="w-[1px]">
					<div>
						{/* {"translate-x-[" + boxSize() + "] -scale-x-100"}> */}
						<SVGConnector
							width={connectorSizes()[1] || 0}
							height={100}
							radius={24}
							startColor="#3B82F6"
							endColor="#3B82F6"
						/>
					</div>
				</div>
				<div id="connector3" class="w-[calc(100%_/_2_-_80px_-_((100%_-_80px)_/_3)_/_2)]">
					<div>
						{/* {"translate-x-[" + boxSize() + "] -scale-x-100"}> */}
						<SVGConnector
							width={connectorSizes()[2] || 0}
							height={100}
							radius={24}
							startColor="#8B5CF6"
							endColor="#8B5CF6"
						/>
					</div>
				</div>
			</div>

			<div class="z-10 relative flex justify-between px-10 pb-20">
				<For each={data}>
					{(card) => (
						<a
							href={card.link}
							class="bg-background w-[calc((100%_-_80px)_/_3)] rounded-2xl border border-surface-3 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-2 transition-all duration-200 hover:border-outline-variant/70"
						>
							<img width="100%" src={card.image} alt={card.title} />
							<div class="p-8 flex flex-col gap-2">
								<div class="flex gap-4">
									<h3 class="text-base text-surface-900 font-semibold">{card.title}</h3>
									<Show when={card.isSoon}>
										<p class="h-6 bg-primary/10 text-primary px-2 flex justify-center items-center w-fit rounded-md">
											soon
										</p>
									</Show>
								</div>
								<p class="text-sm text-outline-variant">{card.description}</p>
							</div>
						</a>
					)}
				</For>
			</div>
		</SectionLayout>
	)
}

export default ConfigPage
