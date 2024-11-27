import IconUpload from "./../../components/icons/IconUpload.tsx";
import SectionHeader from "./../../components/SectionHeader.tsx";
import ListItems from "./../../components/ListItems.tsx";
import { fileIdSearchParamsAtom, filesAtom, lixAtom } from "./../../state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "./../../helper/saveLixToOpfs.ts";
import { Button } from "./../../../components/ui/button.tsx"
import { Separator } from "./../../../components/ui/separator.tsx"
import { activeFileAtom, allChangesAtom, allChangesDynamicGroupingAtom, changesCurrentVersionAtom } from "./../../state-active-file.ts";
import { Link, useNavigate } from "react-router-dom";
import { ChangeComponent } from "../../components/ChangeComponent.tsx";
import { DynamicChangeGroup } from "./../../components/DynamicChangeGroup.tsx";

export default function Page() {
	// state atoms
	const [lix] = useAtom(lixAtom);
	const [files] = useAtom(filesAtom);
	const [changesCurrentVersion] = useAtom(changesCurrentVersionAtom);
	const [allChangesDynamicGrouping] = useAtom(allChangesDynamicGroupingAtom)
	const [activeFile] = useAtom(activeFileAtom)
	const [fileIdSearchParams] = useAtom(fileIdSearchParamsAtom)

	//hooks
	const navigate = useNavigate();

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
		<div className="flex bg-white h-full">
			<div className="max-w-[340px] flex-1 flex flex-col h-full">
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
				<div className="max-h-[calc(100%_-_60px)] overflow-y-scroll">
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
				<Link to="/" className="flex-grow" />
			</div>
			<Separator orientation="vertical" className="h-screen" />
			
			{fileIdSearchParams 
				? <div className="flex-1 h-full">
					<SectionHeader backaction={() => navigate("/")}title={activeFile?.path.replace("/", "") ? `/ ${activeFile?.path.replace("/", "")}` : "Graph"} />
					<div className="px-[10px] h-[calc(100%_-_60px)] overflow-y-scroll flex-shrink-0">
						{changesCurrentVersion.map((change, i) => (
								<ChangeComponent
									key={change.id}
									change={change}
									showTopLine={i !== 0}
									showBottomLine={i !== changesCurrentVersion.length - 1}
								/>
							))
						}
					</div> 
				</div> 
				: <div className="flex-1 h-full">
					<SectionHeader title="Overview" />
					<div className="px-[10px] h-[calc(100%_-_60px)] overflow-y-scroll">
							{Object.entries(allChangesDynamicGrouping).map(([date, changes], i) => {
								return (
									<DynamicChangeGroup
										key={date}
										changes={changes}
										showTopLine={i !== 0}
										showBottomLine={i !== Object.keys(allChangesDynamicGrouping).length - 1}
									/>
								)
							})}
					</div> 
				</div> 
			}
		</div>
	);
}