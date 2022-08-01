import { Result } from '@inlang/result';
import { InlangConfig, validate } from '@inlang/config';
import { CommonFsApi } from '../types/commonFsApi';

/**
 * Reads and validates the inlang.config.json file from the given path.
 */
export async function readInlangConfig(args: {
    fs: CommonFsApi;
    path: string;
}): Promise<Result<InlangConfig['any'], Error>> {
    try {
        const decoder = new TextDecoder();
        const file = await args.fs.readFile(args.path);
        const decodedFile = decoder.decode(file);
        const config = JSON.parse(decodedFile);
        const validation = validate({ config });
        if (validation.isErr) {
            throw validation.error;
        }
        return Result.ok(config);
    } catch (error) {
        return Result.err(error as Error);
    }
}
