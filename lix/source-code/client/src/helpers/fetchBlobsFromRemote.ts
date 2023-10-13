import type { NodeishFilesystem } from "@lix-js/fs";
import { fetch } from "isomorphic-git"
import { withLazyInjection } from "../helpers.js";

export async function fetchBlobsFromRemote(args: {
    fs: NodeishFilesystem, 
    gitdir: string, 
    http: any, 
    oids: string[], 
    allOids: string[]
}) {
    try {
    
        console.time('Lazy fetching');
        await fetch({
            fs: args.fs,
            gitdir: args.gitdir,
            // this time we fetch with blobs but we skip all objects but the one that was requested by fs
            http: withLazyInjection(args.http, { 
                noneBlobFilter: false, 
                overrideHaves: args.allOids.filter( oneOid => !args.oids.includes(oneOid) )
            }), // TODO use http with withFetchInjection and add blob = true
            // http: http,
            depth: 1, 
            singleBranch: true, 
            tags: false,
        });
        console.timeEnd('Lazy fetching');
    } catch (e) {
        console.log('error when trying to fetch a single file');
        throw e;
    }

}