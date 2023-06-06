import { For, Show, createSignal, onMount } from "solid-js"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import SVGConnector from "./assets/connector.jsx"

const code = [
	<p class="text-surface-500">...</p>,
	<p>
		<span class="text-primary-on-inverted-container">plugins</span>: [
	</p>,
	<p>
		<span class="text-primary-on-inverted-container">{"\tideExtensionPlugin"}</span>
		{"(),"}
	</p>,
	<p>
		<span class="text-primary-on-inverted-container">{"\tstandardLintRules"}</span>
		{"(),"}
	</p>,
	<p>
		<span class="text-primary-on-inverted-container">{"\tjsonPlugin"}</span>
		{"({ "}
	</p>,
	<p>
		<span class="text-surface-300">{"\t\tpathPattern"}</span>
		{": "}
		<span class="text-surface-400">{"'./resources/{language}.json'"}</span>
	</p>,
	<p>{"\t}),"}</p>,

	<p>]</p>,
]

const data = [
	{
		title: "Web Editor",
		isSoon: false,
		description:
			"Simplifies translation management by keeping translations in a Git repository without the need for hosting, additional accounts, or synchronization.",
		link: "/documentation/apps/editor",
		image: "/images/AppSVGs/editor.svg",
	},
	{
		title: "IDE Extension",
		isSoon: false,
		description:
			"Improves developer experience when working on localized codebases by extracting translations and performing error checking directly in your IDE. This saves time and reduces the risk of errors.",
		link: "/documentation/apps/ide-extension",
		image: "/images/AppSVGs/ide.svg",
	},
	{
		title: "inlang CLI",
		isSoon: false,
		description:
			"Automates localization via CI/CD through translation validation and automatic machine translation. This saves time and reduces errors, resulting in a more efficient localization process.",
		link: "/documentation/cli",
		image: "/images/AppSVGs/cli.svg",
	},
]

const ConfigPage = () => {
	const [connectorSizes, setConnectorSizes] = createSignal<Array<number>>([0, 0, 0, 0, 0, 0])
	onMount(() => {
		const box1 = document.getElementById("connector1")
		const box2 = document.getElementById("connector2")
		const box3 = document.getElementById("connector3")
		const box4 = document.getElementById("connector4")
		const box5 = document.getElementById("connector5")
		const box6 = document.getElementById("connector6")
		setConnectorSizes([
			box1?.offsetWidth || 0,
			box2?.offsetWidth || 0,
			box3?.offsetWidth || 0,
			box4?.offsetWidth || 0,
			box5?.offsetWidth || 0,
			box6?.offsetWidth || 0,
		])
	})

	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="flex flex-col items-center gap-8 pt-20 px-8 lg:px-0">
				<h2 class="text-center text-3xl font-semibold text-on-background w-full lg:w-1/2 leading-relaxed tracking-tight">
					Multiple apps, endless plugins, one config.
				</h2>
			</div>

			<div class="z-10 relative flex justify-between px-10 pt-10 gap-4 lg:gap-0 flex-col lg:flex-row">
				<For each={data}>
					{(card) => (
						<a
							href={card.link}
							class="bg-background w-full lg:w-[calc((100%_-_80px)_/_3)] rounded-2xl border border-surface-3 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-2 transition-all duration-200 hover:border-outline-variant/70 hover:text-primary"
						>
							<img width="100%" src={card.image} alt={card.title} />
							<div class="p-8 flex flex-col gap-2">
								<div class="flex gap-4">
									<h3 class="text-base font-semibold">{card.title}</h3>
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
			<div class="z-10 relative flex justify-center px-10 gap-10 overflow-hidden transition-all duration-200 transform -scale-y-100">
				<div id="connector1" class="w-[calc(100%_/_2_-_40px_-_((100%_-_80px)_/_3)_/_2)]">
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
				<div id="connector3" class="w-[calc(100%_/_2_-_40px_-_((100%_-_80px)_/_3)_/_2)]">
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
			<div class="flex flex-col items-center gap-8 px-8 lg:px-0">
				<div class="relative" style={{ "box-shadow": "0px 0px 300px 300px #fafafa" }}>
					<div class="relative z-10 bg-background border border-background rounded-lg overflow-hidden">
						<pre class="h-14 w-32 flex flex-col justify-center items-center bg-surface-1 text-lg font-medium text-surface-700">
							plugins
						</pre>
					</div>
					<div
						style={{
							background:
								"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
						}}
						class="absolute bg-on-background top-0 left-0 w-full h-full opacity-100 blur-3xl"
					/>
					<div
						style={{
							background:
								"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
						}}
						class="absolute bg-on-background top-0 left-0 w-full h-full opacity-30 blur-xl"
					/>
					<div
						style={{
							background:
								"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
						}}
						class="absolute bg-on-background top-0 left-0 w-full h-full opacity-50 blur-sm"
					/>
				</div>
			</div>
			<div class="z-10 relative flex justify-center px-10 gap-10 overflow-hidden transition-all duration-200">
				<div id="connector4" class="w-[1px]">
					<div>
						<SVGConnector
							width={connectorSizes()[3] || 0}
							height={60}
							radius={24}
							startColor="#06B6D4"
							endColor="#06B6D4"
						/>
					</div>
				</div>
				<div id="connector5" class="w-[1px]">
					<div>
						<SVGConnector
							width={connectorSizes()[4] || 0}
							height={60}
							radius={24}
							startColor="#3B82F6"
							endColor="#3B82F6"
						/>
					</div>
				</div>
				<div id="connector6" class="w-[1px]">
					<div>
						<SVGConnector
							width={connectorSizes()[5] || 0}
							height={60}
							radius={24}
							startColor="#8B5CF6"
							endColor="#8B5CF6"
						/>
					</div>
				</div>
			</div>
			<div class="flex flex-col items-center gap-8 px-8 pb-28 lg:px-0">
				<div class="w-full lg:w-fit overflow-x-scroll relative flex flex-col gap-2 bg-gradient-to-b from-inverted-surface to-surface-700 text-on-inverted-surface py-3 rounded-lg shadow-lg">
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
