/**
 * Key value storage interface.
 */
export type Storage = {
	get(key: string): Promise<Blob | undefined>;
	set(key: string, value: Blob): Promise<void>;
	delete(key: string): Promise<void>;
};
