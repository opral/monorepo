const hashStringToBase36 = (value: string): string => {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
	}
	return hash.toString(36);
};

export const createNodeIdPrefix = (fileId?: string | null): string => {
	if (!fileId) return "mdwc";
	return `mdwc_${hashStringToBase36(fileId)}`;
};
