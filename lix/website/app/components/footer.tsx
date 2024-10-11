import { socialLinks } from "./header"
import IconCopyright from "./icons/copyright"
import IconSubstack from "./icons/substack"

export const Footer = () => {
	return (
		<>
			<div className="w-full mt-20 mb-4 border-t border-surface-200">
				<footer className="mt-8 w-full max-w-5xl px-4 py-3 mx-auto flex flex-col gap-4">
					<div className="card flex flex-wrap justify-between items-end md:items-center gap-4">
						<p className="flex flex-col gap-0.5 text-slate-800">
							<span className="font-semibold mb-0.5">Stay in the loop!</span>
							Get regular updates and be the first who can use Lix.
						</p>
						<a
							href="https://opral.substack.com/"
							target="_blanc"
							className="w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2"
						>
							<IconSubstack />
							Subscribe
						</a>
					</div>
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-8">
							<div className="flex whitespace-nowrap gap-0.5 items-center text-slate-900 font-semibold">
								<IconCopyright />
								Lix by Opral
							</div>
						</div>

						<div className="flex items-center gap-2">
							{socialLinks.map((socialLink, index) => (
								<a
									key={index}
									className="p-2 text-slate-500 hover:text-cyan-600"
									href={socialLink.href}
									target="_blank"
									rel="noopener noreferrer"
								>
									{socialLink.text}
								</a>
							))}
						</div>
					</div>
				</footer>
			</div>
		</>
	)
}

export default Footer
