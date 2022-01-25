export function isValidEmail(email: string): boolean {
	if (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
		return true;
	}
	return false;
}
