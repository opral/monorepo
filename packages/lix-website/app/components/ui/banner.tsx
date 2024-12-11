import IconArrowExternal from "../icons/arrow-external"

const Banner = () => {
	return (
		<div className="flex justify-center items-center gap-3 h-16 md:h-[50px] text-[16px] px-3 bg-slate-100 border-b border-slate-200 text-black font-medium">
			New: Lix File Manager (Preview)
			<a
				className="group text-cyan-600 hover:text-black border border-slate-200 md:mx-3 flex gap-2 items-center py-1 px-3 rounded-md bg-white whitespace-nowrap"
				href="/app/fm"
			>
				Take a look
			</a>
		</div>
	)
}

export default Banner
