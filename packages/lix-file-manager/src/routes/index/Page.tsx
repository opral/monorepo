import IconUpload from "./../../components/icons/IconUpload.tsx";
import SectionHeader from "./../../components/SectionHeader.tsx";
import { Separator } from "./../../../components/ui/separator.tsx";
import ListItems from "./../../components/ListItems.tsx";
import { filesAtom, lixAtom } from "./../../state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "./../../helper/saveLixToOpfs.ts";
import { Button } from "./../../../components/ui/button.tsx"

export default function Page() {
	// state atoms
	const [lix] = useAtom(lixAtom);
	const [files] = useAtom(filesAtom);

	// handlers
	const handleUpload = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await lix.db
				.insertInto("file")
				.values(
					{
						path: "/" + file.name,
						data: await file.arrayBuffer(),
					}
				)
				.execute()

            	await saveLixToOpfs({ lix });
			}
        }
		input.click();
    }

	return (
		<div className="flex h-screen bg-white">
			<div className="w-full">
				<SectionHeader title="Files">
					<Button variant="secondary" onClick={() => handleUpload()}>
						<IconUpload />
						Upload
					</Button>
				</SectionHeader>
				{/* <FileList /> */}
				{files.map((file) => {
					return (
						<ListItems
							key={file.id}
							id={file.id}
							type="file"
							name={file.path.replace("/", "")}
						/>
					);
				})}
			</div>
			<Separator orientation="vertical" />
			<div className="w-full">
				<SectionHeader title="Graph" />
			</div>
		</div>
	);
}