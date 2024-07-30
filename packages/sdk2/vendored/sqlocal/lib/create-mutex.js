export function createMutex() {
    let promise;
    let resolve;
    const lock = async () => {
        while (promise) {
            await promise;
        }
        promise = new Promise((res) => {
            resolve = res;
        });
    };
    const unlock = async () => {
        const res = resolve;
        promise = undefined;
        resolve = undefined;
        res?.();
    };
    return { lock, unlock };
}
//# sourceMappingURL=create-mutex.js.map