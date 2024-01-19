const LixSection = () => {
	return (
		<div class="pt-12 md:pt-20 flex flex-col items-center pb-20">
			<p class="bg-background px-4 py-1.5 rounded-full text-sm font-medium w-fit border shadow border-surface-300">
				Ecosystem powered by
			</p>
			<h2 class="font-bold text-2xl md:text-4xl text-surface-900 text-center mt-5">
				Lix Change Control
			</h2>
			<p class="text-center text-lg max-w-[600px] text-surface-500 pt-5">
				Get complete control over modifications in your inlang project with the built-in Lix Change
				Control. This will help you take charge of changes and ensure a stress-free project
				shipping.
			</p>
			<div class="w-full grid grid-cols-2 mt-10">
				<div class="col-span-1 bg-background rounded-lg border border-surface-200">Test</div>
				<div class="col-span-1 bg-background rounded-lg border border-surface-200">Test</div>
			</div>
		</div>
	)
}

export default LixSection
