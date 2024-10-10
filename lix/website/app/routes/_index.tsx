import type { MetaFunction } from "@remix-run/node"
import Header, { socialLinks } from "../components/header"
import Footer from "../components/footer"
import Check from "~/components/ui/check"
import IconArrowExternal from "~/components/icons/arrow-external"
import Details from "~/components/ui/details"
import IconLogoTabelle from "~/components/icons/logo-tabelle"
import IconLogoPapier from "~/components/icons/logo-papier"
import IconLogoInlang from "~/components/icons/logo-inlang"

export const meta: MetaFunction = () => {
	return [
		{ title: "Lix - Change Control System" },
		{
			name: "description",
			content:
				"The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang.",
		},
	]
}

const coreFeatures = [
	{
		title: "Fully understands changes",
		description:
			"Lix does not save versions; it provides access to each individual change in a file.",
	},
	{
		title: "File agnostic",
		description: "Lix can understand any file format with the help of plugins.",
	},
	{
		title: "Apps with change control",
		description: "Lix enables file-based apps with change control features.",
	},
]

const enabledByChangeControl = [
	{
		title: "Collaboration",
		list: ["Sync & async workflows", "Change proposals", "Review changes"],
		image: "/images/collaboration.svg",
	},
	{
		title: "Automation",
		list: ["Build pipelines", "Validation rules"],
		image: "/images/automation.svg",
	},
	{
		title: "Change Graph",
		list: ["Traceability", "Auditing", "Recovery"],
		image: "/images/change-graph.svg",
	},
]

const appsBuiltOnTopOfLix = [
	{
		title: "Table-App",
		link: "https://csv-n2qj.onrender.com/",
		icon: <IconLogoTabelle />,
		description: "Get change control in your CSV file editor.",
	},
	{
		title: "Text-Editor",
		link: "https://opral.substack.com/p/collaborative-markdown-with-lix-change",
		icon: <IconLogoPapier />,
		description: "Take notes and collaborate with change control.",
	},
	{
		title: "Translation-App",
		link: "fink2.onrender.com",
		icon: <IconLogoInlang />,
		description: "Collaborate on translations with change control.",
	},
]

const faq = [
	{
		question: "What is the difference between a Lix app and a conventional file in a Lix system?",
		answer:
			"Changes in conventional files are only tracked when saved to the Lix file system. Therefore, features are only available via the Lix file system, while editing happens only in conventional apps. Lix apps are built on the system and define their file format. This allows them to use all the functions in the app to improve the editing process and collaboration workflow. If conventional apps have a plug-in interface, it could be used to integrate Lix features.",
	},
	{
		question: "How is it different from my current file-sharing solution?",
		answer:
			"Your current file-sharing solution may show which of your colleagues made the last change to a file, but you don't know what changed, what the previous version was and what the context of the changes was.",
	},
	{
		question: "How does it compare to versioning I know from other apps?",
		answer:
			"There are apps with versioning, but in many cases, they only save versions of the entire project at specific points in time. Lix tracks and understands the context of every change in a file, giving you more context and allowing you to set automations. Furthermore, Lix provides a generalized system that allows all files and apps to work together.",
	},
	{
		question: "Is lix replacing git?",
		answer:
			"No. Lix is designed to change control non-text files and build apps, not version source code.",
	},
]

export default function Index() {
	return (
		<div className="min-h-screen">
			<Header />
			<main className="w-full max-w-5xl px-4 mx-auto space-y-24">
				<div className="grid grid-cols-2 gap-24 mt-12 mb-12">
					<div>
						<div>
							<h1 className="text-5xl font-semibold">The change control system for files</h1>
							{/* files */}
							{/* <span className="text-5xl font-semibold">
                files
              </span> */}
						</div>
						<p className="mt-8 mb-6">
							The lix change control system allows storing, tracking, querying, and reviewing
							changes in different file formats, e.g. .xlsx, .sqlite, or .inlang.
						</p>
						<a
							href="https://opral.substack.com/"
							target="_blanc"
							className="w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold flex items-center gap-2"
						>
							Get updates
						</a>
					</div>
					<div>
						{coreFeatures.map((feature, index) => (
							<div key={index} className="mb-4 max-w-sm flex items-start gap-5">
								<Check />
								<div className="space-y-1">
									<h2 className="font-semibold">{feature.title}</h2>
									<p>{feature.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col items-center">
					<h2 className="text-3xl font-semibold">Enabled by change control</h2>
					<p className="max-w-md text-center mt-2 mb-8">
						Every app built on top of Lix comes with differentiating features out of the box.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
						{enabledByChangeControl.map((feature, index) => (
							<div key={index} className="card flex flex-col items-start gap-3 w-full">
								<img src={feature.image} alt={feature.title} className="w-[240px] h-[200px]" />
								<h3 className="font-semibold">{feature.title}</h3>
								<ul className="list-disc list-inside flex flex-col gap-0.5">
									{feature.list.map((item, index) => (
										<li key={index} className="list-item text-slate-500">
											{item}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col items-center">
					<h2 className="text-3xl font-semibold">How to experience the system?</h2>
					<p className="max-w-2xl text-center mt-2 mb-8">
						Change control can be accessed in file-based applications that are already built on Lix
						or the Lix File Manager, which can track changes of conventional files.
					</p>
					<div className="card relative w-full">
						<img
							src="/images/file-manager.svg"
							alt="Simlified sketch of the lix file manager"
							className="w-[724x] h-[300px] mt-4 -mb-10 mx-auto"
						/>
						<span className="font-semibold">Lix File Manager</span>
						<p>All your files under change control.</p>
						<p className="absolute right-6 bottom-6 w-fit bg-white ring ring-1 ring-slate-200 px-4 py-2 rounded-full">
							Coming soon
						</p>
					</div>

					<div className="w-full my-16 relative flex items-center">
						<div className="absolute w-fit left-0 right-0 mx-auto bg-white font-semibold text-slate-500 px-6">
							Apps that built on top of Lix
						</div>
						<div className="w-full border-b border-slate-200"></div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
						{appsBuiltOnTopOfLix.map((app, index) => (
							<a
								key={index}
								href={app.link}
								className="relative card font-semibold gap-4 w-full group"
							>
								<div className="absolute top-6 right-6 flex justify-center items-center w-10 h-10 rounded-full bg-white text-slate-500 ring-1 ring-slate-200 group-hover:text-cyan-500  group-hover:ring-cyan-500">
									<div className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
										<IconArrowExternal />
									</div>
								</div>
								<div>{app.icon}</div>
								<div className="mt-4">{app.title}</div>
								<p className="font-normal mt-2">{app.description}</p>
							</a>
						))}
					</div>

					<div className="card relative w-full mt-4">
						<span className="font-semibold">SDK to build Apps on Lix</span>
						<p>Build your own apps with the Lix SDK to access change control features.</p>
						<p className="absolute right-6 bottom-6 w-fit bg-white ring-1 ring-slate-200 px-4 py-2 rounded-full">
							Coming soon
						</p>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-24">
					<div>
						<h2 className="text-3xl font-semibold">Open questions?</h2>
						<div className="mt-4 flex gap-4">
							{socialLinks
								.map((socialLink, index) => (
									<a
										key={index}
										href={socialLink.href}
										target="_blank"
										rel="noopener noreferrer"
										className="px-4 py-2 ring-1 ring-slate-200 rounded-md text-slate-500 hover:text-cyan-600 hover:ring-cyan-600"
									>
										{socialLink.text}
									</a>
								))
								.slice(0, 2)}
						</div>
					</div>
					<div className="col-span-2 space-y-4">
						{faq.map((question, index) => (
							<div key={index}>
								<Details summary={question.question} content={question.answer} />
								{faq.length - 1 !== index && <div className="mt-3 border-b border-slate-200"></div>}
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-4 max-w-xl mx-auto pl-20 border-l-2 border-surface-200">
					<p className="italic text-slate-800">
						"Every work that we create, every time we collaborate, everything we automate, it
						revolves around changes. A system, that can understand changes and inform you about that
						these changes happened, means that you have a system to collaborate, validate, automate
						and create."
					</p>
					<p>Samuel Stroschein, Founder of Opral (lix & inlang)</p>
				</div>
			</main>
			<Footer />
		</div>
	)
}
