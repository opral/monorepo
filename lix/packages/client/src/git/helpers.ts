const fileModeTypeMapping = {
  "40": "folder",
  "10": "file",
  "12": "symlink",
};

export function modeToFileType(mode: number) {
  const fileMode: string = mode.toString(8).slice(0, 2);
  // @ts-ignore
  return fileModeTypeMapping[fileMode] || "unknown";
}
