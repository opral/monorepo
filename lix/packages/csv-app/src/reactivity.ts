export function poll<T>(fn: () => T, callback: (value: Awaited<T>) => void) {
  const poll = async () => {
    const value = await fn();
    callback(value);
    setTimeout(poll, 1000);
  };

  poll();
}
