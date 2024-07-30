type Mutex = {
    lock: () => Promise<void>;
    unlock: () => Promise<void>;
};
export declare function createMutex(): Mutex;
export {};
