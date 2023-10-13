import type { NodeishFilesystem } from "@lix-js/fs"
import { readObject } from "isomorphic-git"

export async function blobExistsLocaly(fs: NodeishFilesystem, oid: string, gitdir: string) {
    try {

        await readObject({
            // we don't want to intercept calls of read Object 
            fs,
            oid,
            gitdir,
            format: 'deflated' // NOTE this stops early in _readObject no hashing etc
        })
        // const stats: Stats = await fs.stat(filePath); - doesn't work 
        // object file exists localy... 
        return true;
        // console.log('trying to find hash: ' + oid + ' (files: ' + oidToFilePaths[oid]?.join() + ') locally - found' );
    } catch (err) {
        // we only expect "Error NO ENTry" - rethrow on other
        if ((err as any).code !== 'ENOENT' && (err as any).code !== 'NotFoundError') {
            throw err
        }
    }
    return false;
}