import IconUpload from "./../../components/icons/IconUpload.tsx";
import { Button } from "./../../components/Button.tsx";
import SectionHeader from "./../../components/SectionHeader.tsx";
import { Separator } from "./../../components/Separator.tsx";

export default function Page() {
	return (
		<div className="flex h-screen bg-white">
			<div className="w-full">
				<SectionHeader title="Files">
					<Button variant="secondary">
						<IconUpload />
						Upload
					</Button>
				</SectionHeader>
				{/* <FileList /> */}
			</div>
			<Separator orientation="vertical" />
			<div className="w-full">
				<SectionHeader title="Graph" />
			</div>
		</div>
	);
}