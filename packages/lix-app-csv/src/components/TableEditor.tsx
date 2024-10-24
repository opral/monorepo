import { useAtom } from "jotai";
import {
	DynamicDataSheetGrid,
	textColumn,
	keyColumn,
} from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import Papa from "papaparse";
import { lixAtom } from "../state.ts";
import { useEffect, useMemo, useState } from "react";
import {
	activeCellAtom,
	activeFileAtom,
	activeRowChangesAtom,
	parsedCsvAtom,
	uniqueColumnAtom,
} from "../routes/editor/state.ts";
import CellGraph from "./CellGraph.tsx";

export default function TableEditor() {
	const [parsedCsv] = useAtom(parsedCsvAtom);
	const [lix] = useAtom(lixAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [activeCell, setActiveCell] = useAtom(activeCellAtom);
	const [activeRowChanges] = useAtom(activeRowChangesAtom);
	const [screenHeight, setScreenHeight] = useState<number>(800);

	const handleUpdateCsvData = async (
		newData: Array<Record<string, string>>
	) => {
		await lix.db
			.updateTable("file")
			.set("data", await new Blob([Papa.unparse(newData)]).arrayBuffer())
			.where("id", "=", activeFile.id)
			.execute();
	};

	const columns = useMemo(
		() =>
			parsedCsv.meta.fields!.map((field) => ({
				...keyColumn(field, textColumn),
				title: field,
			})),
		[parsedCsv]
	);

	useEffect(() => {
		setScreenHeight(window.innerHeight - 82);
	}, [window.innerHeight]);

	return (
		<div className="grid grid-cols-4">
			<div className="col-span-4 md:col-span-3">
				<DynamicDataSheetGrid
					disableContextMenu
					value={parsedCsv.data}
					columns={columns}
					height={screenHeight}
					onChange={(newData) => handleUpdateCsvData(newData)}
					rowKey={uniqueColumn}
					onActiveCellChange={(obj) => setActiveCell(obj.cell)}
				/>
			</div>
			<CellGraph
				activeCell={activeCell!}
				activeRowChanges={activeRowChanges}
			></CellGraph>
		</div>
	);
}
