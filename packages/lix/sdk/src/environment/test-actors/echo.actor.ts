const globalScope = self as any;

globalScope.onmessage = (event: MessageEvent) => {
	// Echo back the data so tests can observe initialization + pings.
	globalScope.postMessage({ received: event.data });
};
