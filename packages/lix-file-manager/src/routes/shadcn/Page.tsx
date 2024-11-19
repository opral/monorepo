import { useAtom } from "jotai";
// import { InputTest } from "./../../components/InputTest.tsx";
import { filesAtom, lixAtom } from "./../../state.ts";
import { saveLixToOpfs } from "./../../helper/saveLixToOpfs.ts";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { activeFileAtom } from "./../../state-active-file.ts";

export default function Page() {
    // atoms
    const [lix] = useAtom(lixAtom);
    const [files] = useAtom(filesAtom);
    const [activeFile] = useAtom(activeFileAtom);

    // hooks
    const [searchParams, setSearchParams] = useSearchParams();

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
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

    const handleSelectFile = async (fileId: string) => {
        setSearchParams({f: fileId});
    }

	return (
		<div className="w-full">
			{/* Test
            <InputTest /> */}
            
            <div className="flex justify-between pt-8">
                <p className="font-bold">Test render files</p>
                <input onChange={(e) => handleUpload(e)} type="file" />
            </div>
            {files.map((file) => {
                return (
                    <div key={file.id} onClick={()=> handleSelectFile(file.id)} className={clsx(searchParams.get("f") === file.id ? "bg-slate-200": "", "cursor-pointer hover:bg-slate-100")}>
                        {file.path + " " + file.id}
                    </div>
                );
            })}
            <p className="pt-8">Active File</p>
            <pre>{JSON.stringify(activeFile, null, 2)}</pre>
		</div>
	);
}
