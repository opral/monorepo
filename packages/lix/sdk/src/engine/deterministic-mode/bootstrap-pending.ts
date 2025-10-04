let deterministicBootstrapPending = false;

export function setDeterministicBoot(value: boolean): void {
	deterministicBootstrapPending = value;
}

export function isDeterministicBootPending(): boolean {
	return deterministicBootstrapPending;
}
