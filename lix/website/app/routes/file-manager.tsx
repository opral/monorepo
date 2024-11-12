import { socialLinks } from "~/components/header"
import Details from "~/components/ui/details"

const faq = [
	{
		question: "What is that in the air?",
		answer: "It's superman.",
	},
	{
		question: "Is it a plane?",
		answer: "It's superman.",
	},
	{
		question: "Is it a plane?",
		answer: "It's superman.",
	},
]

export default function FileManager() {
	return (
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
	)
}
