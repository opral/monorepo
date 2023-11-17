import type { NodeishFilesystem } from "@lix-js/fs"
import { readObject } from "isomorphic-git"

/**
 * This helper function checks the git folder for the existance of a blob. May it be within a pack file or as loose object. 
 * It returns true if the blob can be found and false if not. 
 * 
 * @param fs the filesystem that has access to the repository. MUST not be an intercepted filesystem since this would lead to recruision // TODO #1459 we may want to check this at runtime / compiletime
 * @param oid the hash of the content of a file or a file we want to check if it exists locally // TODO #1459 think about folders here
 * @param gitdir the dire to look for blobs in 
 * @returns 
 */
export async function blobExistsLocaly(fs: NodeishFilesystem, oid: string, gitdir: string) {
    try {

        await readObject({
            // fs must not be intercepted - we don't want to intercept calls of read Object  // TODO #1459 can we check this by type checking or an added flag property for better dx?
            fs,
            oid,
            gitdir,
            // NOTE: we use deflated to stop early in _readObject no hashing etc is happening for format deflated
            format: 'deflated' 
        })

        // read object will fail with a thrown error if it can't find an object with the fiven oid...
        return true;
        
    } catch (err) {
        // we only expect "Error NO ENTry" or iso-gits NotFoundError - rethrow on others
        if ((err as any).code !== 'ENOENT' && (err as any).code !== 'NotFoundError') {
            throw err
        }
    }
    return false;
}