const fileModeTypeMapping = {
	"40000": "folder",
	"100644": "file",
	"100755": "file", // (executable)
	"120000": "symlink",
	"": "unknown",
}

// TODO change .toString(8) with only relevant digits

export function modeToFileType(mode: number) {
	const fileMode: string = mode?.toString(8) || ""
	// @ts-ignore
	return fileModeTypeMapping[fileMode]
}
