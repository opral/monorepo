export type Result<T, E> = {
    readonly data: T | null;
    readonly error: E | null;
};
