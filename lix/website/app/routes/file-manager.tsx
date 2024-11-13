import Footer from "~/components/footer"
import Header, { socialLinks } from "~/components/header"
import IconArrowExternal from "~/components/icons/arrow-external"
import IconBranch from "~/components/icons/branch"
import IconConversation from "~/components/icons/conversation"
import IconLix from "~/components/icons/lix"
import IconSync from "~/components/icons/sync"
import Banner from "~/components/ui/banner"
import Check from "~/components/ui/check"
import Details from "~/components/ui/details"

const faq = [
	{
		question: "When will this be available for general use?",
		answer:
			"Lix is currently in the closed beta phase, where we're actively refining features based on user feedback. We’re excited to announce a launch event on December 16th. Sign up to join and be among the first to experience the release!",
	},
	{
		question: "How does this integrate with my already existing software?",
		answer:
			"Lix is file-based, meaning you can seamlessly use your preferred applications alongside Lix’s internal tools. For instance, you can edit a CSV file in Numbers or Excel, and once you're done, simply upload it back to the Lix file manager. Lix will automatically understand the changes you made.",
	},
	{
		question: "Where does my data get stored?",
		answer:
			"By default, your data is stored locally on your device, allowing for full offline support out of the box. Your files are only synced with other users or cloud storage when you choose to do so, ensuring complete control over your data.",
	},
	{
		question: "How Lix compare to Git / version control?",
		answer:
			"Lix focuses on simplifying file management and collaboration, especially for non-developers. Read more about that in on lix.opral.com",
	},
	{
		question: "Is Lix free or do I need to buy it?",
		answer:
			"The public beta will be completely free to use. As we approach the official launch, we’re still finalizing future pricing plans.",
	},
	{
		question: "Does Lix also work with AI?",
		answer:
			"Yes! Lix offers a flexible automation surface where you can connect any AI API of your choice. Additionally, native AI features are on our roadmap.",
	},
]

const automatedTasks = [
	{
		title: "Build pipelines",
	},
	{
		title: "Quality checks",
	},
	{
		title: "Connect external APIs",
	},
]

const collaborationFeatures = [
	{
		title: "Sync your lix with others",
		description: "Easily share your Lix with others to keep everyone on the same page.",
		icon: <IconSync />,
	},
	{
		title: "Create and share proposals",
		description: "Draft proposals, gather feedback, and refine your ideas—all in one platform.",
		icon: <IconBranch />,
	},
	{
		title: "Achieve quality through review",
		description:
			"Collaborate with your team to review files, make edits, and ensure top-notch quality.",
		icon: <IconConversation />,
	},
]

export default function FileManager() {
	return (
		<>
			<Banner />
			<Header className="bg-slate-50" />
			<main>
				<div className="w-full h-fit bg-slate-50 p-4 slanted">
					<div className="mx-auto max-w-2xl justify-center items-center text-center mt-16 mb-20">
						<div className="mx-auto flex items-center gap-2 w-fit p-2 text-slate-500 ring-1 ring-slate-200 rounded-md mb-3">
							<div className="bg-slate-200 p-1.5 py-1 w-fit rounded">
								<IconLix className="w-4 h-4 text-slate-500" />
							</div>
							File Manager
						</div>
						<h1 className="text-5xl leading-[1.2] font-semibold">
							<span className="relative inline-block after:block after:h-1 after:w-full after:absolute after:skew-y-[-0.5deg] after:-translate-y-1 after:bg-cyan-600">
								Collaborate & automate
							</span>{" "}
							the $h!t🤬 out of your company
						</h1>
						<p className="mx-auto max-w-lg my-8">
							Lix file manager understands changes in your files, making it easy to see detailed
							updates, collaborate, comment, and automate tasks directly within your documents.
						</p>
						<div className="flex justify-center w-full gap-2">
							<a
								href="https://opral.substack.com/"
								target="_blank"
								className="w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all"
							>
								Join waitlist
							</a>
							<a
								href="https://jsnation.us/#person-samuel-stroschein"
								target="_blanc"
								className="w-full sm:w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex justify-center items-center gap-2 border border-slate-300 hover:border-slate-400 transition-all"
							>
								See our pitch at JS Nation US
								<IconArrowExternal />
							</a>
						</div>
					</div>
				</div>

				<div className="w-full max-w-5xl mx-auto px-4 space-y-16 md:space-y-32">
					<div>
						<h2 className="text-center w-full">Effortless Collaboration</h2>
						<p className="text-center mt-4">Sync, share, and succeed together.</p>
						<div className="my-8 flex justify-center gap-4 bg-slate-100 col-span-7 rounded-lg border border-slate-200">
							<img
								className="ml-7 mt-7 w-fit border-t border-x border-slate-200 rounded-t-lg"
								src="/images/fm-collaborate-1.svg"
								alt="File Manager Automate"
							/>
							<img
								className="mr-7 mt-7 w-fit border-t border-x border-slate-200 rounded-t-lg"
								src="/images/fm-collaborate-2.svg"
								alt="File Manager Automate"
							/>
						</div>
						<div className="grid md:grid-cols-3 gap-8 md:gap-4">
							{collaborationFeatures.map((feature, index) => (
								<div key={index}>
									{feature.icon}
									<h3 className="mt-4">{feature.title}</h3>
									<p className="mt-2">{feature.description}</p>
								</div>
							))}
						</div>
					</div>

					<div className="grid md:grid-cols-12 gap-8 md:gap-4">
						<div className="bg-slate-100 col-span-7 rounded-lg border border-slate-200">
							<img
								className="mx-8 mt-7 w-fit border-t border-x border-slate-200 rounded-t-lg"
								src="/images/fm-automate.svg"
								alt="File Manager Automate"
							/>
						</div>
						<div className="col-span-4 col-start-9">
							<h2 className="pt-2 pr-8">Automations for non-techies</h2>
							<p className="mt-4">
								Link automations to file changes, making it easy to configure pipelines, run quality
								checks, and integrate APIs—all triggered automatically.
							</p>
							<div className="pt-4">
								{automatedTasks.map((feature, index) => (
									<div key={index} className="my-4 max-w-sm flex items-start gap-5">
										<Check />
										<div className="space-y-1">
											<h3 className="font-semibold">{feature.title}</h3>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="grid md:grid-cols-3 gap-8 md:gap-4">
						<div className="col-span-2 md:col-span-1">
							<h2>Open questions?</h2>
							<div className="mt-4 flex gap-2">
								{socialLinks
									.map((socialLink, index) => (
										<a
											key={index}
											href={socialLink.href}
											target="_blank"
											rel="noopener noreferrer"
											className="transition-all w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex items-center gap-2 border border-slate-300 hover:border-slate-400"
										>
											{socialLink.text}
										</a>
									))
									.slice(0, 2)}
							</div>
						</div>
						<div className="md:mt-3 col-span-2 space-y-3 md:space-y-6">
							{faq.map((question, index) => (
								<div key={index}>
									<Details summary={question.question} content={question.answer} />
									{faq.length - 1 !== index && (
										<div className="mt-3 md:mt-6 border-b border-slate-200"></div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="w-full border border-slate-200 rounded-xl grid md:grid-cols-3 gap-8 md:gap-4">
						<div className="p-8 flex flex-col justify-between">
							<div className="w-full">
								<h2 className="text-xl pt-2">Join the waitlist!</h2>
								<p className="mt-4">
									Sign up now to be the first to experience the Lix File Manager as soon as it's
									released!
								</p>
							</div>
							<a
								href="https://opral.substack.com/"
								target="_blank"
								className="mt-4 w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all"
							>
								Join waitlist
							</a>
						</div>
						<div className="col-span-2 pt-8">
							<img
								className="w-full border-t border-l border-slate-200 rounded-tl-lg"
								src="/images/fm-waitlist.svg"
								alt="File Manager Waitlist"
							/>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</>
	)
}
