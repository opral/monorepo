import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { DEMO_CAP_TABLE_CSV_FILE_ID } from "../../helper/demo-lix-file/demoLixFile.ts";
import { useNavigate } from "react-router-dom";

export const DemoCard = () => {
	const navigate = useNavigate();

	return (
		<div className="w-full rounded-lg bg-[#ECECEC]">
			<div className="md:hidden rounded-lg overflow-hidden grayscale-100 -mb-8 sm:-mb-20">
				<img
					src="/captable-cover-small.png"
					alt="cap-table"
					className="w-full mt-8"
				/>
			</div>
			<div className="flex flex-col md:flex-row px-10 pt-8 items-center md:justify-center relative z-10">
				<div className="space-y-2">
					<h2 className="text-2xl max-w-[500px]">
						Lix brings change control to{" "}
						<span className="bg-zinc-300 text-zinc-800 rounded-sm">.csv</span>{" "}
						(and many other) file formats.
					</h2>
					<a href="https://lix.opral.com/" target="_blank" className="">
						<h3 className="text-lg text-zinc-500 underline">
							Learn more about lix
						</h3>
					</a>
				</div>
				<SlButton
					size="medium"
					variant="primary"
					className="mt-6 md:mt-0 mb-8 md:mb-0"
					onClick={() => {
						navigate(`/editor?fileId=${DEMO_CAP_TABLE_CSV_FILE_ID}`);
					}}
				>
					Open example csv
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
