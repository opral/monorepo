import type { NodeishFilesystem } from "@lix-js/fs";
import { fetchBlobsFromRemote } from "./fetchBlobsFromRemote.js";

let nextFetchOids = undefined as undefined | Set<string>;
let requestedFetches = [] as { resolve: (value: unknown) => void, reject: (reason?: any) => void}[];

export async function fetchBlobsFromRemoteThrottled(args: {
    fs: NodeishFilesystem, 
    gitdir: string, 
    http: any, 
    oids: string[], 
    allOids: string[]
}) {
    const fetchRequestPromise = new Promise((resolve, reject) => {
        requestedFetches.push({
            reject,
            resolve,
        })
    });

    if (nextFetchOids === undefined) {
        nextFetchOids = new Set<string>;
        args.oids.forEach(oid => nextFetchOids!.add(oid));
        setTimeout(() => {
            const oIdsToFetch = [...nextFetchOids!];
            nextFetchOids = undefined;
            const requestedFetchesBatch = requestedFetches.slice();
            requestedFetches = [];
            fetchBlobsFromRemote({
                fs: args.fs,
                gitdir: args.gitdir,
                http: args.http,
                oids: oIdsToFetch,
                allOids: args.allOids
            }).then((value) => requestedFetchesBatch.forEach(request => request.resolve(value)))
            .catch((reason) => requestedFetchesBatch.forEach(request => request.reject(reason)));
            
        }, 1);
    } else {
        args.oids.forEach(oid => nextFetchOids!.add(oid));
    }

    return fetchRequestPromise;

}