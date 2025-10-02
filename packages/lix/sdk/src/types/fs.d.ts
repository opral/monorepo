declare module "fs" {
	export const promises: {
		writeFile(path: string, data: string, encoding?: string): Promise<void>;
	};
}
