import * as papaparse from "papaparse";

export const parseCsvFields = (data: ArrayBuffer | undefined) => {
	const parsedData = data
		? papaparse.parse(new TextDecoder().decode(data), {
				skipEmptyLines: true,
				header: true,
			})
		: undefined;
	return parsedData?.meta?.fields;
};
