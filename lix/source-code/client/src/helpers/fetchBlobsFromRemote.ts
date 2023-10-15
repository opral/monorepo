import type { NodeishFilesystem } from "@lix-js/fs";
import { fetch } from "isomorphic-git"
import { httpWithLazyInjection } from "./httpWithLazyInjection.js"

export async function fetchBlobsFromRemote(args: {
    fs: NodeishFilesystem, 
    gitdir: string, 
    http: any, 
    oids: string[], 
    allOids: string[]
}) {
    await fetch({
        fs: args.fs,
        gitdir: args.gitdir,
        // this time we fetch with blobs but we skip all objects but the one that was requested by fs
        http: httpWithLazyInjection(args.http, { 
            noneBlobFilter: false, 
            overrideHaves: undefined, //args.allOids.filter( oneOid => !args.oids.includes(oneOid) ),
            overrideWants: args.oids,
        }), // TODO use http with withFetchInjection and add blob = true
        // http: http,
        depth: 1, 
        singleBranch: true, 
        tags: false,
    });
}