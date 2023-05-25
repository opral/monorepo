export function originChecked(getOrigin) {
	if (getOrigin.startsWith("https://" || getOrigin.endsWith(".git"))) {
		const checkedOrigin = getOrigin
		return checkedOrigin
	} else {
		return "wrong Origin"
	}
}
