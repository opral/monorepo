import Footer from "~/components/footer"
import Header, { socialLinks } from "~/components/header"
import IconArrowExternal from "~/components/icons/arrow-external"
import IconLix from "~/components/icons/lix"
import Banner from "~/components/ui/banner"
import Details from "~/components/ui/details"

const faq = [
	{
		question: "What is that in the air?",
		answer: "It's superman.",
	},
	{
		question: "Is it a bird?",
		answer: "It's superman.",
	},
	{
		question: "Is it a plane?",
		answer: "It's superman.",
	},
]

export default function FileManager() {
	return (
		<>
			<Banner />
			<Header className="bg-slate-50" />
			<main className="relative">
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

				<div className="w-full max-w-5xl mx-auto px-4 space-y-16 md:space-y-24">
					{/* grid for  */}
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
				</div>
			</main>
			<Footer />
		</>
	)
}
