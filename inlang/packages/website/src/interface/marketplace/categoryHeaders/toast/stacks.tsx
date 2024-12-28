import { StackList } from "#src/pages/index/custom_section/Personas/Developer.jsx";

const Stacks = () => {
	return (
		<>
			<h2 class="pb-4 pt-2 border-t-surface-200 text-xl font-medium tracking-tight text-surface-900">
				{`Stack-based Tooling`}
			</h2>
			<div class="bg-background overflow-x-scoll rounded-xl border border-surface-200 w-full pb-4 px-6 mb-8 gap-4">
				<StackList />
			</div>
		</>
	);
};

export default Stacks;
