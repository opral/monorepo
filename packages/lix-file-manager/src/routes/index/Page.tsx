import IconUpload from "./../../components/icons/IconUpload.tsx";
import SectionHeader from "./../../components/SectionHeader.tsx";
import ListItems from "./../../components/ListItems.tsx";
import { fileIdSearchParamsAtom, filesAtom, lixAtom } from "./../../state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "./../../helper/saveLixToOpfs.ts";
import { Button } from "./../../../components/ui/button.tsx"
import { Separator } from "./../../../components/ui/separator.tsx"
import { activeFileAtom, allChangesAtom, changesCurrentVersionAtom } from "./../../state-active-file.ts";
import { Link } from "react-router-dom";
import { ChangeComponent } from "../../components/ChangeComponent.tsx";
import { DynamicChangeGroup } from "./../../components/DynamicChangeGroup.tsx";

export default function Page() {
	// state atoms
	const [lix] = useAtom(lixAtom);
	const [files] = useAtom(filesAtom);
	const [changesCurrentVersion] = useAtom(changesCurrentVersionAtom);
	const [allChanges] = useAtom(allChangesAtom)
	const [activeFile] = useAtom(activeFileAtom)
	const [fileIdSearchParams] = useAtom(fileIdSearchParamsAtom)

	// handlers
	const handleUpload = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await lix.db
					.insertInto("file")
					.values({
						path: "/" + file.name,
						data: await file.arrayBuffer(),
					})
					.execute();
				await saveLixToOpfs({ lix });
			}
		};
		input.click();
	};

	// const showChanges = async () => {
	// 	const changes = await lix.db
	// 		.selectFrom("change")
	// 		//.where("change.id", "=", "01934402-465d-799c-85cd-d700ac0f91a2")
	// 		.selectAll()
	// 		.execute();

	// 	console.log(changes);
	// }

	// useEffect(() => {
	// 	console.log("getAuthors")
	// 	showChanges()
	// })

	return (
		<div className="flex bg-white">
			<div className="max-w-[340px] flex-1 flex flex-col">
				<SectionHeader title="Files">
					<Button variant="ghost" onClick={async () => {
						// @ts-expect-error - globally defined
						await window.deleteLix();
						window.location.reload();
					}}>
						Reset
					</Button>
					<Button variant="secondary" onClick={() => handleUpload()}>
						<IconUpload />
						Upload
					</Button>
				</SectionHeader>
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
				<Link to="/" className="flex-grow" />
			</div>
			<Separator orientation="vertical" className="h-screen" />
			
			{fileIdSearchParams 
				? <div className="flex-1">
					<SectionHeader title={activeFile?.path || "Graph"} />
					<div className="px-[10px]">
						{changesCurrentVersion.map((change, i) => (
								<ChangeComponent
									key={change.id}
									change={change}
									author={{
										id: "test",
										name: "Nils Jacobsen"
									}}
									showTopLine={i !== 0}
									showBottomLine={i !== changesCurrentVersion.length - 1}
								/>
							))
						}
					</div> 
				</div> 
				: <div className="flex-1">
					<SectionHeader title="Overview" />
					<div className="px-[10px]">
						{allChanges.map((change, i) => (
								<DynamicChangeGroup
									key={change.id}
									changes={[change]}
									authors={[{
										id: "test",
										name: "Nils Jacobsen"
									}]}
									showTopLine={i !== 0}
									showBottomLine={i !== allChanges.length - 1}
								/>
							))
							
						}
					</div> 
				</div> 
			}
		</div>
	);
}