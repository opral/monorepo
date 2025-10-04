declare module "fs" {
	export const promises: {
		writeFile(path: string, data: string, encoding?: string): Promise<void>;
		mkdir(
			path: string,
			options?: {
				recursive?: boolean;
			}
		): Promise<void>;
	};
}
