const Details = (props: { summary: string; content: string }) => {
	return (
		<details>
			<summary
				className="flex gap-2 justify-between cursor-pointer font-medium list-none transition-colors text-slate-500 hover:text-cyan-500
        after:inline-block after:w-6 after:h-6 after:p-3 after:bg-contain after:bg-[url('/images/chevron-down.svg')] after:bg-no-repeat after:transform after:rotate-0 after:transition-transform after:duration-200 after:ease-in-out"
			>
				{props.summary}
			</summary>
			<p className="my-3 sm:pr-8 lg:w-11/12">{props.content}</p>
		</details>
	)
}

export default Details
