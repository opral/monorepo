import { SlButton } from "@shoelace-style/shoelace/dist/react";

export const DemoCard = () => {
	return (
		<div className="w-full rounded-lg bg-[#ECECEC] my-12">
			<div className="md:hidden rounded-lg overflow-hidden grayscale-100 -mb-8 sm:-mb-20">
				<img
					src="/captable-cover-small.png"
					alt="cap-table"
					className="w-full mt-8"
				/>
			</div>
			<div className="flex flex-col md:flex-row px-10 pt-8 relative z-10">
				<div className="flex-1">
					<p className="text-zinc-500">CAP TABLE DEMO</p>
					<h2 className="text-2xl max-w-[500px] mt-2">
						Never again burden yourself with manually storing .csv files to
						track changes.
					</h2>
				</div>
				<SlButton
					size="medium"
					variant="primary"
					className="mt-6 md:mt-0 mb-8 md:mb-0"
				>
					Open Demo
				</SlButton>
			</div>
			<div className="hidden md:block rounded-lg overflow-hidden grayscale-100">
				<img
					src="/captable-cover-big.png"
					alt="cap-table"
					className="w-full mt-8"
				/>
			</div>
		</div>
	);
};
