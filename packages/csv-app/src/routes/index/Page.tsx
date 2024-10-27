import { DemoCard } from "./DemoCard.tsx";
import FileExplorer from "./FileExplorer.tsx";

export default function Page() {
	return (
		<div className="w-full max-w-5xl mx-auto">
			<div className="mt-8 px-4">
				<DemoCard />
				<div className="flex items-end mt-6 w-full justify-between">
					<div className="flex items-center gap-2">
						<p className="text-xl text-zinc-700 font-medium">Files</p>
					</div>
				</div>
			</div>
			<FileExplorer></FileExplorer>
		</div>
	);
}
