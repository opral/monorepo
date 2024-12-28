export const getRedirectPath = (
	path: string,
	from: string,
	to: string
): string | undefined => {
	const regex = new RegExp("^" + from.replace("*", "(.*)") + "$");
	if (regex.test(path)) {
		return path.replace(regex, to.replace("*", "$1"));
	}
	return undefined;
};
