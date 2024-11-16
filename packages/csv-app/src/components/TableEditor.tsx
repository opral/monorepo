import { useAtom } from "jotai";
import {
	DynamicDataSheetGrid,
	textColumn,
	keyColumn,
} from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import Papa from "papaparse";
import { lixAtom } from "../state.ts";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	activeCellAtom,
	activeFileAtom,
	activeCellChangesAtom,
	parsedCsvAtom,
	uniqueColumnAtom,
} from "../state-active-file.ts";
import CellGraph from "./CellGraph.tsx";
import { debounce } from "lodash-es";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";

export default function TableEditor() {
	const [parsedCsv] = useAtom(parsedCsvAtom);
	const [lix] = useAtom(lixAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [activeCell, setActiveCell] = useAtom(activeCellAtom);
	const [activeCellChanges] = useAtom(activeCellChangesAtom);
	const [screenHeight, setScreenHeight] = useState<number>(800);

	// useCallback because react shouldn't recreate the function on every render
	// debounce because keystroke changes are not important for the lix 1.0 preview
	// given that we do not have real-time collabroation and no feature yet to
	// delete changes/disregard keystroke changes on merge
	const handleUpdateCsvData = useCallback(
		debounce(async (newData: Array<Record<string, string>>) => {
			const csv = Papa.unparse(newData);

			await lix.db
				.updateTable("file")
				.set("data", await new Blob([csv]).arrayBuffer())
				.where("id", "=", activeFile.id)
				.returningAll()
				.execute();

			// needed because lix is not writing to OPFS yet
			await saveLixToOpfs({ lix });
		}, 500),
		[]
	);

	const columns = useMemo(
		() =>
			parsedCsv.meta.fields!.map((field) => ({
				...keyColumn(field, textColumn),
				title: field === uniqueColumn ? `${field} (unique column)` : field,
			})),
		[parsedCsv]
	);

	useEffect(() => {
		setScreenHeight(window.innerHeight - 200);
	}, [window.innerHeight]);

	return (
		<div className="grid grid-cols-4">
			<div className="col-span-4 md:col-span-3">
				<DynamicDataSheetGrid
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
				activeCellChanges={activeCellChanges}
			></CellGraph>
		</div>
	);
}
