export type types = number;
export type TreeEntry = {
    /**
     * - the 6 digit hexadecimal mode
     */
    mode: string;
    /**
     * - the name of the file or directory
     */
    path: string;
    /**
     * - the SHA-1 object id of the blob or tree
     */
    oid: string;
    /**
     * - the type of object
     */
    type: "blob" | "commit" | "tree";
};
export type GitProgressEvent = {
    phase: string;
    loaded: number;
    total: number;
};
export type ProgressCallback = (progress: GitProgressEvent) => void | Promise<void>;
export type GitHttpRequest = {
    /**
     * - The URL to request
     */
    url: string;
    /**
     * - The HTTP method to use
     */
    method?: string;
    /**
     * - Headers to include in the HTTP request
     */
    headers?: {
        [x: string]: string;
    };
    /**
     * - An HTTP or HTTPS agent that manages connections for the HTTP client (Node.js only)
     */
    agent?: any;
    /**
     * - An async iterator of Uint8Arrays that make up the body of POST requests
     */
    body?: any;
    /**
     * - Reserved for future use (emitting `GitProgressEvent`s)
     */
    onProgress?: ProgressCallback;
    /**
     * - Reserved for future use (canceling a request)
     */
    signal?: any;
};
export type GitHttpResponse = {
    /**
     * - The final URL that was fetched after any redirects
     */
    url: string;
    /**
     * - The HTTP method that was used
     */
    method?: string;
    /**
     * - HTTP response headers
     */
    headers?: {
        [x: string]: string;
    };
    /**
     * - An async iterator of Uint8Arrays that make up the body of the response
     */
    body?: any;
    /**
     * - The HTTP status code
     */
    statusCode: number;
    /**
     * - The HTTP status message
     */
    statusMessage: string;
};
export type HttpFetch = (request: GitHttpRequest) => Promise<GitHttpResponse>;
export type HttpClient = {
    request: HttpFetch;
};
/**
 * A git commit object.
 */
export type CommitObject = {
    /**
     * Commit message
     */
    message: string;
    /**
     * SHA-1 object id of corresponding file tree
     */
    tree: string;
    /**
     * an array of zero or more SHA-1 object ids
     */
    parent: string[];
    author: {
        /**
         * The author's name
         */
        name: string;
        /**
         * The author's email
         */
        email: string;
        /**
         * UTC Unix timestamp in seconds
         */
        timestamp: number;
        /**
         * Timezone difference from UTC in minutes
         */
        timezoneOffset: number;
    };
    committer: {
        /**
         * The committer's name
         */
        name: string;
        /**
         * The committer's email
         */
        email: string;
        /**
         * UTC Unix timestamp in seconds
         */
        timestamp: number;
        /**
         * Timezone difference from UTC in minutes
         */
        timezoneOffset: number;
    };
    /**
     * PGP signature (if present)
     */
    gpgsig?: string;
};
/**
 * A git tree object. Trees represent a directory snapshot.
 */
export type TreeObject = TreeEntry[];
/**
 * A git annotated tag object.
 */
export type TagObject = {
    /**
     * SHA-1 object id of object being tagged
     */
    object: string;
    /**
     * the type of the object being tagged
     */
    type: "blob" | "tag" | "commit" | "tree";
    /**
     * the tag name
     */
    tag: string;
    tagger: {
        /**
         * the tagger's name
         */
        name: string;
        /**
         * the tagger's email
         */
        email: string;
        /**
         * UTC Unix timestamp in seconds
         */
        timestamp: number;
        /**
         * timezone difference from UTC in minutes
         */
        timezoneOffset: number;
    };
    /**
     * tag message
     */
    message: string;
    /**
     * PGP signature (if present)
     */
    gpgsig?: string;
};
export type ReadCommitResult = {
    /**
     * - SHA-1 object id of this commit
     */
    oid: string;
    /**
     * - the parsed commit object
     */
    commit: CommitObject;
    /**
     * - PGP signing payload
     */
    payload: string;
};
/**
 * - This object has the following schema:
 */
export type ServerRef = {
    /**
     * - The name of the ref
     */
    ref: string;
    /**
     * - The SHA-1 object id the ref points to
     */
    oid: string;
    /**
     * - The target ref pointed to by a symbolic ref
     */
    target?: string;
    /**
     * - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
     */
    peeled?: string;
};
export type Walker = {
    /**
     * ('GitWalkerSymbol')
     */
    Symbol: Symbol;
};
/**
 * Normalized subset of filesystem `stat` data:
 */
export type Stat = {
    ctimeSeconds: number;
    ctimeNanoseconds: number;
    mtimeSeconds: number;
    mtimeNanoseconds: number;
    dev: number;
    ino: number;
    mode: number;
    uid: number;
    gid: number;
    size: number;
};
/**
 * The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.
 */
export type WalkerEntry = {
    type: () => Promise<"blob" | "commit" | "tree" | "special">;
    mode: () => Promise<number>;
    oid: () => Promise<string>;
    content: () => Promise<void | Uint8Array>;
    stat: () => Promise<Stat>;
};
export type CallbackFsClient = {
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
     */
    readFile: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
     */
    writeFile: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback
     */
    unlink: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback
     */
    readdir: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback
     */
    mkdir: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback
     */
    rmdir: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback
     */
    stat: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback
     */
    lstat: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback
     */
    readlink?: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback
     */
    symlink?: Function;
    /**
     * - https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback
     */
    chmod?: Function;
};
export type PromiseFsClient = {
    promises: {
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
         */
        readFile: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
         */
        writeFile: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
         */
        unlink: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
         */
        readdir: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
         */
        mkdir: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path
         */
        rmdir: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
         */
        stat: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
         */
        lstat: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
         */
        readlink?: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
         */
        symlink?: Function;
        /**
         * - https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
         */
        chmod?: Function;
    };
};
export type FsClient = CallbackFsClient | PromiseFsClient;
export type MessageCallback = (message: string) => void | Promise<void>;
export type GitAuth = {
    username?: string;
    password?: string;
    headers?: {
        [x: string]: string;
    };
    /**
     * Tells git to throw a `UserCanceledError` (instead of an `HttpError`).
     */
    cancel?: boolean;
};
export type AuthCallback = (url: string, auth: GitAuth) => void | GitAuth | Promise<void | GitAuth>;
export type AuthFailureCallback = (url: string, auth: GitAuth) => void | GitAuth | Promise<void | GitAuth>;
export type AuthSuccessCallback = (url: string, auth: GitAuth) => void | Promise<void>;
export type SignParams = {
    /**
     * - a plaintext message
     */
    payload: string;
    /**
     * - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
     */
    secretKey: string;
};
export type SignCallback = (args: SignParams) => {
    signature: string;
} | Promise<{
    signature: string;
}>;
export type MergeDriverParams = {
    branches: string[];
    contents: string[];
    path: string;
};
export type MergeDriverCallback = (args: MergeDriverParams) => {
    cleanMerge: boolean;
    mergedText: string;
} | Promise<{
    cleanMerge: boolean;
    mergedText: string;
}>;
export type WalkerMap = (filename: string, entries: WalkerEntry[]) => Promise<any>;
export type WalkerReduce = (parent: any, children: any[]) => Promise<any>;
export type WalkerIterateCallback = (entries: WalkerEntry[]) => Promise<any[]>;
export type WalkerIterate = (walk: WalkerIterateCallback, children: any) => Promise<any[]>;
export type RefUpdateStatus = {
    ok: boolean;
    error: string;
};
export type PushResult = {
    ok: boolean;
    error: string | null;
    refs: {
        [x: string]: RefUpdateStatus;
    };
    headers?: {
        [x: string]: string;
    };
};
export type HeadStatus = 0 | 1;
export type WorkdirStatus = 0 | 1 | 2;
export type StageStatus = 0 | 1 | 2 | 3;
export type StatusRow = [string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3];
declare var index: Readonly<{
    __proto__: null;
    AlreadyExistsError: typeof AlreadyExistsError;
    AmbiguousError: typeof AmbiguousError;
    CheckoutConflictError: typeof CheckoutConflictError;
    CommitNotFetchedError: typeof CommitNotFetchedError;
    EmptyServerResponseError: typeof EmptyServerResponseError;
    FastForwardError: typeof FastForwardError;
    GitPushError: typeof GitPushError;
    HttpError: typeof HttpError;
    InternalError: typeof InternalError;
    InvalidFilepathError: typeof InvalidFilepathError;
    InvalidOidError: typeof InvalidOidError;
    InvalidRefNameError: typeof InvalidRefNameError;
    MaxDepthError: typeof MaxDepthError;
    MergeNotSupportedError: typeof MergeNotSupportedError;
    MergeConflictError: typeof MergeConflictError;
    MissingNameError: typeof MissingNameError;
    MissingParameterError: typeof MissingParameterError;
    MultipleGitError: typeof MultipleGitError;
    NoRefspecError: typeof NoRefspecError;
    NotFoundError: typeof NotFoundError;
    ObjectTypeError: typeof ObjectTypeError;
    ParseError: typeof ParseError;
    PushRejectedError: typeof PushRejectedError;
    RemoteCapabilityError: typeof RemoteCapabilityError;
    SmartHttpError: typeof SmartHttpError;
    UnknownTransportError: typeof UnknownTransportError;
    UnsafeFilepathError: typeof UnsafeFilepathError;
    UrlParseError: typeof UrlParseError;
    UserCanceledError: typeof UserCanceledError;
    UnmergedPathsError: typeof UnmergedPathsError;
    IndexResetError: typeof IndexResetError;
}>;
/**
 * This is just a collection of helper functions really. At least that's how it started.
 */
export class FileSystem {
    constructor(fs: any);
    _original_unwrapped_fs: any;
    /**
     * Return true if a file exists, false if it doesn't exist.
     * Rethrows errors that aren't related to file existence.
     */
    async exists(filepath: any, options?: {}): Promise<boolean>;
    /**
     * Return the contents of a file if it exists, otherwise returns null.
     *
     * @param {string} filepath
     * @param {object} [options]
     *
     * @returns {Promise<Buffer|string|null>}
     */
    async read(filepath: string, options?: any): Promise<any>;
    /**
     * Write a file (creating missing directories if need be) without throwing errors.
     *
     * @param {string} filepath
     * @param {Buffer|Uint8Array|string} contents
     * @param {object|string} [options]
     */
    async write(filepath: string, contents: any, options?: any): Promise<void>;
    /**
     * Make a directory (or series of nested directories) without throwing an error if it already exists.
     */
    async mkdir(filepath: any, _selfCall?: boolean): Promise<void>;
    /**
     * Delete a file without throwing an error if it is already deleted.
     */
    async rm(filepath: any): Promise<void>;
    /**
     * Delete a directory without throwing an error if it is already deleted.
     */
    async rmdir(filepath: any, opts: any): Promise<void>;
    /**
     * Read a directory without throwing an error is the directory doesn't exist
     */
    async readdir(filepath: any): Promise<any>;
    /**
     * Return a flast list of all the files nested inside a directory
     *
     * Based on an elegant concurrent recursive solution from SO
     * https://stackoverflow.com/a/45130990/2168416
     */
    async readdirDeep(dir: any): Promise<any>;
    /**
     * Return the Stats of a file/symlink if it exists, otherwise returns null.
     * Rethrows errors that aren't related to file existence.
     */
    async lstat(filename: any): Promise<any>;
    /**
     * Reads the contents of a symlink if it exists, otherwise returns null.
     * Rethrows errors that aren't related to file existence.
     */
    async readlink(filename: any, opts?: {
        encoding: string;
    }): Promise<any>;
    /**
     * Write the contents of buffer to a symlink.
     */
    async writelink(filename: any, buffer: any): Promise<any>;
}
export class GitAnnotatedTag {
    static from(tag: any): GitAnnotatedTag;
    static render(obj: any): string;
    static async sign(tag: any, sign: any, secretKey: any): Promise<GitAnnotatedTag>;
    constructor(tag: any);
    _tag: any;
    justHeaders(): any;
    message(): any;
    parse(): any;
    render(): any;
    headers(): {
        tagger: any;
        committer: any;
    };
    withoutSignature(): any;
    gpgsig(): any;
    payload(): string;
    toObject(): any;
}
export class GitCommit {
    static fromPayloadSignature({ payload, signature }: {
        payload: any;
        signature: any;
    }): GitCommit;
    static from(commit: any): GitCommit;
    static justMessage(commit: any): any;
    static justHeaders(commit: any): any;
    static renderHeaders(obj: any): string;
    static render(obj: any): string;
    static async sign(commit: any, sign: any, secretKey: any): Promise<GitCommit>;
    constructor(commit: any);
    _commit: any;
    toObject(): any;
    headers(): {
        parent: never[];
    };
    message(): any;
    parse(): any;
    parseHeaders(): {
        parent: never[];
    };
    render(): any;
    withoutSignature(): any;
    isolateSignature(): any;
}
export class GitConfig {
    static from(text: any): GitConfig;
    constructor(text: any);
    parsedConfig: any;
    async get(path: any, getall?: boolean): Promise<any>;
    async getall(path: any): Promise<any>;
    async getSubsections(section: any): Promise<any>;
    async deleteSection(section: any, subsection: any): Promise<void>;
    async append(path: any, value: any): Promise<void>;
    async set(path: any, value: any, append?: boolean): Promise<void>;
    toString(): any;
}
export class GitConfigManager {
    static async get({ fs, gitdir }: {
        fs: any;
        gitdir: any;
    }): Promise<GitConfig>;
    static async save({ fs, gitdir, config }: {
        fs: any;
        gitdir: any;
        config: any;
    }): Promise<void>;
}
export class GitIgnoreManager {
    static async isIgnored({ fs, dir, gitdir, filepath }: {
        fs: any;
        dir: any;
        gitdir?: any;
        filepath: any;
    }): Promise<boolean>;
}
export class GitIndex {
    static async from(buffer: any): Promise<GitIndex>;
    static async fromBuffer(buffer: any): Promise<GitIndex>;
    static async _entryToBuffer(entry: any): Promise<any>;
    constructor(entries: any, unmergedPaths: any);
    _dirty: boolean;
    _unmergedPaths: any;
    _entries: any;
    _addEntry(entry: any): void;
    get unmergedPaths(): any[];
    get entries(): any[];
    get entriesMap(): any;
    get entriesFlat(): any;
    [Symbol.iterator](): {};
    insert({ filepath, stats, oid, stage }: {
        filepath: any;
        stats: any;
        oid: any;
        stage?: number | undefined;
    }): void;
    delete({ filepath }: {
        filepath: any;
    }): void;
    clear(): void;
    has({ filepath }: {
        filepath: any;
    }): any;
    render(): string;
    async toObject(): Promise<any>;
}
export class GitIndexManager {
    /**
     *
     * @param {object} opts
     * @param {import('../models/FileSystem.js').FileSystem} opts.fs
     * @param {string} opts.gitdir
     * @param {object} opts.cache
     * @param {bool} opts.allowUnmerged
     * @param {function(GitIndex): any} closure
     */
    static async acquire({ fs, gitdir, cache, allowUnmerged }: {
        fs: any;
        gitdir: string;
        cache: any;
        allowUnmerged: (val: any) => boolean;
    }, closure: (arg0: GitIndex) => any): Promise<undefined>;
}
export class GitObject {
    static wrap({ type, object }: {
        type: any;
        object: any;
    }): any;
    static unwrap(buffer: any): {
        type: any;
        object: any;
    };
}
export class GitPackIndex {
    static async fromIdx({ idx, getExternalRefDelta }: {
        idx: any;
        getExternalRefDelta: any;
    }): Promise<GitPackIndex | undefined>;
    static async fromPack({ pack, getExternalRefDelta, onProgress }: {
        pack: any;
        getExternalRefDelta: any;
        onProgress: any;
    }): Promise<GitPackIndex>;
    constructor(stuff: any);
    offsetCache: {};
    async toBuffer(): Promise<any>;
    async load({ pack }: {
        pack: any;
    }): Promise<void>;
    pack: any;
    async unload(): Promise<void>;
    async read({ oid }: {
        oid: any;
    }): any;
    async readSlice({ start }: {
        start: any;
    }): any;
}
/**
pkt-line Format
---------------

Much (but not all) of the payload is described around pkt-lines.

A pkt-line is a variable length binary string.  The first four bytes
of the line, the pkt-len, indicates the total length of the line,
in hexadecimal.  The pkt-len includes the 4 bytes used to contain
the length's hexadecimal representation.

A pkt-line MAY contain binary data, so implementers MUST ensure
pkt-line parsing/formatting routines are 8-bit clean.

A non-binary line SHOULD BE terminated by an LF, which if present
MUST be included in the total length. Receivers MUST treat pkt-lines
with non-binary data the same whether or not they contain the trailing
LF (stripping the LF if present, and not complaining when it is
missing).

The maximum length of a pkt-line's data component is 65516 bytes.
Implementations MUST NOT send pkt-line whose length exceeds 65520
(65516 bytes of payload + 4 bytes of length data).

Implementations SHOULD NOT send an empty pkt-line ("0004").

A pkt-line with a length field of 0 ("0000"), called a flush-pkt,
is a special case and MUST be handled differently than an empty
pkt-line ("0004").

----
  pkt-line     =  data-pkt / flush-pkt

  data-pkt     =  pkt-len pkt-payload
  pkt-len      =  4*(HEXDIG)
  pkt-payload  =  (pkt-len - 4)*(OCTET)

  flush-pkt    = "0000"
----

Examples (as C-style strings):

----
  pkt-line          actual value
  ---------------------------------
  "0006a\n"         "a\n"
  "0005a"           "a"
  "000bfoobar\n"    "foobar\n"
  "0004"            ""
----
*/
export class GitPktLine {
    static flush(): any;
    static delim(): any;
    static encode(line: any): any;
    static streamReader(stream: any): () => Promise<any>;
}
export class GitRefManager {
    static async updateRemoteRefs({ fs, gitdir, remote, refs, symrefs, tags, refspecs, prune, pruneTags, }: {
        fs: any;
        gitdir: any;
        remote: any;
        refs: any;
        symrefs: any;
        tags: any;
        refspecs?: any;
        prune?: boolean | undefined;
        pruneTags?: boolean | undefined;
    }): Promise<{
        pruned: any[];
    }>;
    static async writeRef({ fs, gitdir, ref, value }: {
        fs: any;
        gitdir: any;
        ref: any;
        value: any;
    }): Promise<void>;
    static async writeSymbolicRef({ fs, gitdir, ref, value }: {
        fs: any;
        gitdir: any;
        ref: any;
        value: any;
    }): Promise<void>;
    static async deleteRef({ fs, gitdir, ref }: {
        fs: any;
        gitdir: any;
        ref: any;
    }): Promise<void>;
    static async deleteRefs({ fs, gitdir, refs }: {
        fs: any;
        gitdir: any;
        refs: any;
    }): Promise<void>;
    /**
     * @param {object} args
     * @param {import('../models/FileSystem.js').FileSystem} args.fs
     * @param {string} args.gitdir
     * @param {string} args.ref
     * @param {number} [args.depth]
     * @returns {Promise<string>}
     */
    static async resolve({ fs, gitdir, ref, depth }: {
        fs: any;
        gitdir: string;
        ref: string;
        depth?: number;
    }): Promise<string>;
    static async exists({ fs, gitdir, ref }: {
        fs: any;
        gitdir: any;
        ref: any;
    }): Promise<boolean>;
    static async expand({ fs, gitdir, ref }: {
        fs: any;
        gitdir: any;
        ref: any;
    }): Promise<any>;
    static async expandAgainstMap({ ref, map }: {
        ref: any;
        map: any;
    }): Promise<string>;
    static resolveAgainstMap({ ref, fullref, depth, map }: {
        ref: any;
        fullref?: any;
        depth?: any;
        map: any;
    }): any;
    static async packedRefs({ fs, gitdir }: {
        fs: any;
        gitdir: any;
    }): Promise<any>;
    static async listRefs({ fs, gitdir, filepath }: {
        fs: any;
        gitdir: any;
        filepath: any;
    }): Promise<any>;
    static async listBranches({ fs, gitdir, remote }: {
        fs: any;
        gitdir: any;
        remote: any;
    }): Promise<any>;
    static async listTags({ fs, gitdir }: {
        fs: any;
        gitdir: any;
    }): Promise<any>;
}
export class GitRefSpec {
    static from(refspec: any): GitRefSpec;
    constructor({ remotePath, localPath, force, matchPrefix }: {
        remotePath: any;
        localPath: any;
        force: any;
        matchPrefix: any;
    });
    translate(remoteBranch: any): any;
    reverseTranslate(localBranch: any): any;
}
export class GitRefSpecSet {
    static from(refspecs: any): GitRefSpecSet;
    constructor(rules?: any[]);
    rules: any[];
    add(refspec: any): void;
    translate(remoteRefs: any): any[][];
    translateOne(remoteRef: any): any;
    localNamespaces(): any[];
}
export class GitRemoteHTTP {
    static async capabilities(): Promise<string[]>;
    /**
     * @param {Object} args
     * @param {HttpClient} args.http
     * @param {ProgressCallback} [args.onProgress]
     * @param {AuthCallback} [args.onAuth]
     * @param {AuthFailureCallback} [args.onAuthFailure]
     * @param {AuthSuccessCallback} [args.onAuthSuccess]
     * @param {string} [args.corsProxy]
     * @param {string} args.service
     * @param {string} args.url
     * @param {Object<string, string>} args.headers
     * @param {1 | 2} args.protocolVersion - Git Protocol Version
     */
    static async discover({ http, onProgress, onAuth, onAuthSuccess, onAuthFailure, corsProxy, service, url: _origUrl, headers, protocolVersion, }: {
        http: HttpClient;
        onProgress?: ProgressCallback;
        onAuth?: AuthCallback;
        onAuthFailure?: AuthFailureCallback;
        onAuthSuccess?: AuthSuccessCallback;
        corsProxy?: string;
        service: string;
        url: string;
        headers: {
            [x: string]: string;
        };
        protocolVersion: 1 | 2;
    }): Promise<{
        protocolVersion: number;
        capabilities2: {
            [x: string]: string | true;
        };
    } | {
        capabilities: any;
        refs: any;
        symrefs: any;
        protocolVersion?: undefined;
    } | {
        protocolVersion: number;
        capabilities: any;
        refs: any;
        symrefs: any;
    }>;
    /**
     * @param {Object} args
     * @param {HttpClient} args.http
     * @param {ProgressCallback} [args.onProgress]
     * @param {string} [args.corsProxy]
     * @param {string} args.service
     * @param {string} args.url
     * @param {Object<string, string>} [args.headers]
     * @param {any} args.body
     * @param {any} args.auth
     */
    static async connect({ http, onProgress, corsProxy, service, url, auth, body, headers, }: {
        http: HttpClient;
        onProgress?: ProgressCallback;
        corsProxy?: string;
        service: string;
        url: string;
        headers?: {
            [x: string]: string;
        };
        body: any;
        auth: any;
    }): Promise<GitHttpResponse>;
}
export class GitRemoteManager {
    static getRemoteHelperFor({ url }: {
        url: any;
    }): any;
}
export class GitShallowManager {
    static async read({ fs, gitdir }: {
        fs: any;
        gitdir: any;
    }): Promise<any>;
    static async write({ fs, gitdir, oids }: {
        fs: any;
        gitdir: any;
        oids: any;
    }): Promise<void>;
}
export class GitSideBand {
    static demux(input: any): {
        packetlines: FIFO;
        packfile: FIFO;
        progress: FIFO;
    };
}
export class GitTree {
    static from(tree: any): GitTree;
    constructor(entries: any);
    _entries: any[];
    render(): string;
    toObject(): any;
    /**
     * @returns {TreeEntry[]}
     */
    entries(): TreeEntry[];
    [Symbol.iterator](): {};
}
export const GitWalkSymbol: any;
declare var index$1: Readonly<{
    __proto__: null;
    abbreviateRef: typeof abbreviateRef;
    applyDelta: typeof applyDelta;
    arrayRange: typeof arrayRange;
    assertParameter: typeof assertParameter;
    basename: typeof basename;
    BufferCursor: typeof BufferCursor;
    calculateBasicAuthHeader: typeof calculateBasicAuthHeader;
    collect: typeof collect;
    compareAge: typeof compareAge;
    comparePath: typeof comparePath;
    compareRefNames: typeof compareRefNames;
    compareStats: typeof compareStats;
    compareStrings: typeof compareStrings;
    compareTreeEntryPath: typeof compareTreeEntryPath;
    DeepMap: typeof DeepMap;
    deflate: typeof deflate;
    dirname: typeof dirname;
    emptyPackfile: typeof emptyPackfile;
    extractAuthFromUrl: typeof extractAuthFromUrl;
    FIFO: typeof FIFO;
    filterCapabilities: typeof filterCapabilities;
    flat: (entries: any) => any;
    flatFileListToDirectoryStructure: typeof flatFileListToDirectoryStructure;
    forAwait: typeof forAwait;
    formatAuthor: typeof formatAuthor;
    formatInfoRefs: typeof formatInfoRefs;
    fromEntries: typeof fromEntries;
    fromNodeStream: typeof fromNodeStream;
    fromStream: typeof fromStream;
    fromValue: typeof fromValue;
    getIterator: typeof getIterator;
    listpack: typeof listpack;
    hashObject: typeof hashObject;
    indent: typeof indent;
    inflate: typeof inflate;
    isBinary: typeof isBinary;
    join: typeof join;
    mergeFile: typeof mergeFile;
    mergeTree: typeof mergeTree;
    mode2type: typeof mode2type$1;
    modified: typeof modified;
    normalizeAuthorObject: typeof normalizeAuthorObject;
    normalizeCommitterObject: typeof normalizeCommitterObject;
    normalizeMode: typeof normalizeMode;
    normalizeNewlines: typeof normalizeNewlines;
    normalizePath: typeof normalizePath;
    normalizeStats: typeof normalizeStats;
    outdent: typeof outdent;
    padHex: typeof padHex;
    parseAuthor: typeof parseAuthor;
    pkg: {
        name: string;
        version: string;
        agent: string;
    };
    posixifyPathBuffer: typeof posixifyPathBuffer;
    resolveBlob: typeof resolveBlob;
    resolveCommit: typeof resolveCommit;
    resolveFileIdInTree: typeof resolveFileIdInTree;
    resolveFilepath: typeof resolveFilepath;
    resolveTree: typeof resolveTree;
    rmRecursive: typeof rmRecursive;
    shasum: typeof shasum;
    sleep: typeof sleep;
    splitLines: typeof splitLines;
    StreamReader: typeof StreamReader;
    GitWalkSymbol: any;
    toHex: typeof toHex;
    translateSSHtoHTTP: typeof translateSSHtoHTTP;
    isPromiseLike: typeof isPromiseLike;
    isObject: typeof isObject;
    isFunction: typeof isFunction;
    unionOfIterators: typeof unionOfIterators;
    worthWalking: (filepath: any, root: any) => any;
}>;
/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids
 */
export function _pack({ fs, cache, dir, gitdir, oids, }: {
    fs: any;
    cache: any;
    dir?: string;
    gitdir?: string;
    oids: string[];
}): Promise<any[]>;
/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} [args.format]
 */
export function _readObject({ fs, cache, gitdir, oid, format, }: {
    fs: any;
    cache: any;
    gitdir: string;
    oid: string;
    format?: string;
}): Promise<any>;
export function _writeObject({ fs, gitdir, type, object, format, oid, dryRun, }: {
    fs: any;
    gitdir: any;
    type: any;
    object: any;
    format?: string | undefined;
    oid?: any;
    dryRun?: boolean | undefined;
}): Promise<any>;
export function calculateBasicAuthHeader({ username, password }: {
    username?: string | undefined;
    password?: string | undefined;
}): string;
export function collect(iterable: any): Promise<Uint8Array>;
export function comparePath(a: any, b: any): number;
export function flatFileListToDirectoryStructure(files: any): any;
/**
 * Determine whether a file is binary (and therefore not worth trying to merge automatically)
 *
 * @param {Uint8Array} buffer
 *
 * If it looks incredibly simple / naive to you, compare it with the original:
 *
 * // xdiff-interface.c
 *
 * #define FIRST_FEW_BYTES 8000
 * int buffer_is_binary(const char *ptr, unsigned long size)
 * {
 *  if (FIRST_FEW_BYTES < size)
 *   size = FIRST_FEW_BYTES;
 *  return !!memchr(ptr, 0, size);
 * }
 *
 * Yup, that's how git does it. We could try to be smarter
 */
export function isBinary(buffer: Uint8Array): boolean;
export function join(...parts: any[]): any;
/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {Iterable<string>} args.start
 * @param {Iterable<string>} args.finish
 * @returns {Promise<Set<string>>}
 */
export function listCommitsAndTags({ fs, cache, dir, gitdir, start, finish, }: {
    fs: any;
    cache: any;
    dir?: string;
    gitdir: string;
    start: any;
    finish: any;
}): Promise<any>;
/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {Iterable<string>} args.oids
 * @returns {Promise<Set<string>>}
 */
export function listObjects({ fs, cache, dir, gitdir, oids, }: {
    fs: any;
    cache: any;
    dir?: string;
    gitdir: string;
    oids: any;
}): Promise<any>;
export function mergeFile({ branches, contents }: {
    branches: any;
    contents: any;
}): {
    cleanMerge: boolean;
    mergedText: string;
};
/**
 * Create a merged tree
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ourOid - The SHA-1 object id of our tree
 * @param {string} args.baseOid - The SHA-1 object id of the base tree
 * @param {string} args.theirOid - The SHA-1 object id of their tree
 * @param {string} [args.ourName='ours'] - The name to use in conflicted files for our hunks
 * @param {string} [args.baseName='base'] - The name to use in conflicted files (in diff3 format) for the base hunks
 * @param {string} [args.theirName='theirs'] - The name to use in conflicted files for their hunks
 * @param {boolean} [args.dryRun=false]
 * @param {boolean} [args.abortOnConflict=false]
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 * @returns {Promise<string>} - The SHA-1 object id of the merged tree
 *
 */
export function mergeTree({ fs, cache, dir, gitdir, index, ourOid, baseOid, theirOid, ourName, baseName, theirName, dryRun, abortOnConflict, mergeDriver, }: {
    fs: any;
    cache: any;
    dir?: string;
    gitdir?: string;
    ourOid: string;
    baseOid: string;
    theirOid: string;
    ourName?: string;
    baseName?: string;
    theirName?: string;
    dryRun?: boolean;
    abortOnConflict?: boolean;
    mergeDriver?: MergeDriverCallback;
}): Promise<string>;
/**
 *
 * @param {WalkerEntry} entry
 * @param {WalkerEntry} base
 *
 */
export function modified(entry: WalkerEntry, base: WalkerEntry): Promise<boolean>;
export function padHex(b: any, n: any): any;
export function parseReceivePackResponse(packfile: any): Promise<PushResult>;
export function parseRefsAdResponse(stream: any, { service }: {
    service: any;
}): Promise<{
    protocolVersion: number;
    capabilities2: {
        [x: string]: string | true;
    };
} | {
    capabilities: any;
    refs: any;
    symrefs: any;
    protocolVersion?: undefined;
} | {
    protocolVersion: number;
    capabilities: any;
    refs: any;
    symrefs: any;
}>;
export function parseUploadPackRequest(stream: any): Promise<{
    capabilities: any;
    wants: any[];
    haves: any[];
    shallows: any[];
    depth: number | undefined;
    since: number | undefined;
    exclude: any[];
    relative: boolean;
    done: boolean;
}>;
export function parseUploadPackResponse(stream: any): Promise<any>;
export namespace pkg {
    export const name: string;
    export const version: string;
    export const agent: string;
}
export function readObjectPacked({ fs, cache, gitdir, oid, format, getExternalRefDelta, }: {
    fs: any;
    cache: any;
    gitdir: any;
    oid: any;
    format?: string | undefined;
    getExternalRefDelta: any;
}): Promise<any>;
export function resolveTree({ fs, cache, gitdir, oid }: {
    fs: any;
    cache: any;
    gitdir: any;
    oid: any;
}): any;
export function shasum(buffer: any): Promise<any>;
export function sleep(ms: any): Promise<any>;
export namespace types {
    export const commit: number;
    export const tree: number;
    export const blob: number;
    export const tag: number;
    export const ofs_delta: number;
    export const ref_delta: number;
}
export function uploadPack({ fs, dir, gitdir, advertiseRefs, }: {
    fs: any;
    dir: any;
    gitdir?: any;
    advertiseRefs?: boolean | undefined;
}): Promise<any[] | undefined>;
export function writeReceivePackRequest({ capabilities, triplets, }: {
    capabilities?: any[] | undefined;
    triplets?: any[] | undefined;
}): Promise<any[]>;
export function writeRefsAdResponse({ capabilities, refs, symrefs }: {
    capabilities: any;
    refs: any;
    symrefs: any;
}): Promise<any[]>;
export function writeUploadPackRequest({ capabilities, wants, haves, shallows, depth, since, exclude, }: {
    capabilities?: any[] | undefined;
    wants?: any[] | undefined;
    haves?: any[] | undefined;
    shallows?: any[] | undefined;
    depth?: any;
    since?: any;
    exclude?: any[] | undefined;
}): any[];
declare class AlreadyExistsError extends BaseError {
    /**
     * @param {'note'|'remote'|'tag'|'branch'} noun
     * @param {string} where
     * @param {boolean} canForce
     */
    constructor(noun: "note" | "remote" | "tag" | "branch", where: string, canForce?: boolean);
    code: "AlreadyExistsError";
    name: "AlreadyExistsError";
    data: {
        noun: "note" | "remote" | "tag" | "branch";
        where: string;
        canForce: boolean;
    };
}
declare namespace AlreadyExistsError {
    export const code: 'AlreadyExistsError';
}
declare class AmbiguousError extends BaseError {
    /**
     * @param {'oids'|'refs'} nouns
     * @param {string} short
     * @param {string[]} matches
     */
    constructor(nouns: "oids" | "refs", short: string, matches: string[]);
    code: "AmbiguousError";
    name: "AmbiguousError";
    data: {
        nouns: "oids" | "refs";
        short: string;
        matches: string[];
    };
}
declare namespace AmbiguousError {
    const code_1: 'AmbiguousError';
    export { code_1 as code };
}
declare class CheckoutConflictError extends BaseError {
    /**
     * @param {string[]} filepaths
     */
    constructor(filepaths: string[]);
    code: "CheckoutConflictError";
    name: "CheckoutConflictError";
    data: {
        filepaths: string[];
    };
}
declare namespace CheckoutConflictError {
    const code_2: 'CheckoutConflictError';
    export { code_2 as code };
}
declare class CommitNotFetchedError extends BaseError {
    /**
     * @param {string} ref
     * @param {string} oid
     */
    constructor(ref: string, oid: string);
    code: "CommitNotFetchedError";
    name: "CommitNotFetchedError";
    data: {
        ref: string;
        oid: string;
    };
}
declare namespace CommitNotFetchedError {
    const code_3: 'CommitNotFetchedError';
    export { code_3 as code };
}
declare class EmptyServerResponseError extends BaseError {
    code: "EmptyServerResponseError";
    name: "EmptyServerResponseError";
    data: {};
}
declare namespace EmptyServerResponseError {
    const code_4: 'EmptyServerResponseError';
    export { code_4 as code };
}
declare class FastForwardError extends BaseError {
    code: "FastForwardError";
    name: "FastForwardError";
    data: {};
}
declare namespace FastForwardError {
    const code_5: 'FastForwardError';
    export { code_5 as code };
}
/**
 * @typedef {Object} GitProgressEvent
 * @property {string} phase
 * @property {number} loaded
 * @property {number} total
 */
/**
 * @callback ProgressCallback
 * @param {GitProgressEvent} progress
 * @returns {void | Promise<void>}
 */
/**
 * @typedef {Object} GitHttpRequest
 * @property {string} url - The URL to request
 * @property {string} [method='GET'] - The HTTP method to use
 * @property {Object<string, string>} [headers={}] - Headers to include in the HTTP request
 * @property {Object} [agent] - An HTTP or HTTPS agent that manages connections for the HTTP client (Node.js only)
 * @property {AsyncIterableIterator<Uint8Array>} [body] - An async iterator of Uint8Arrays that make up the body of POST requests
 * @property {ProgressCallback} [onProgress] - Reserved for future use (emitting `GitProgressEvent`s)
 * @property {object} [signal] - Reserved for future use (canceling a request)
 */
/**
 * @typedef {Object} GitHttpResponse
 * @property {string} url - The final URL that was fetched after any redirects
 * @property {string} [method] - The HTTP method that was used
 * @property {Object<string, string>} [headers] - HTTP response headers
 * @property {AsyncIterableIterator<Uint8Array>} [body] - An async iterator of Uint8Arrays that make up the body of the response
 * @property {number} statusCode - The HTTP status code
 * @property {string} statusMessage - The HTTP status message
 */
/**
 * @callback HttpFetch
 * @param {GitHttpRequest} request
 * @returns {Promise<GitHttpResponse>}
 */
/**
 * @typedef {Object} HttpClient
 * @property {HttpFetch} request
 */
/**
 * A git commit object.
 *
 * @typedef {Object} CommitObject
 * @property {string} message Commit message
 * @property {string} tree SHA-1 object id of corresponding file tree
 * @property {string[]} parent an array of zero or more SHA-1 object ids
 * @property {Object} author
 * @property {string} author.name The author's name
 * @property {string} author.email The author's email
 * @property {number} author.timestamp UTC Unix timestamp in seconds
 * @property {number} author.timezoneOffset Timezone difference from UTC in minutes
 * @property {Object} committer
 * @property {string} committer.name The committer's name
 * @property {string} committer.email The committer's email
 * @property {number} committer.timestamp UTC Unix timestamp in seconds
 * @property {number} committer.timezoneOffset Timezone difference from UTC in minutes
 * @property {string} [gpgsig] PGP signature (if present)
 */
/**
 * An entry from a git tree object. Files are called 'blobs' and directories are called 'trees'.
 *
 * @typedef {Object} TreeEntry
 * @property {string} mode the 6 digit hexadecimal mode
 * @property {string} path the name of the file or directory
 * @property {string} oid the SHA-1 object id of the blob or tree
 * @property {'commit'|'blob'|'tree'} type the type of object
 */
/**
 * A git tree object. Trees represent a directory snapshot.
 *
 * @typedef {TreeEntry[]} TreeObject
 */
/**
 * A git annotated tag object.
 *
 * @typedef {Object} TagObject
 * @property {string} object SHA-1 object id of object being tagged
 * @property {'blob' | 'tree' | 'commit' | 'tag'} type the type of the object being tagged
 * @property {string} tag the tag name
 * @property {Object} tagger
 * @property {string} tagger.name the tagger's name
 * @property {string} tagger.email the tagger's email
 * @property {number} tagger.timestamp UTC Unix timestamp in seconds
 * @property {number} tagger.timezoneOffset timezone difference from UTC in minutes
 * @property {string} message tag message
 * @property {string} [gpgsig] PGP signature (if present)
 */
/**
 * @typedef {Object} ReadCommitResult
 * @property {string} oid - SHA-1 object id of this commit
 * @property {CommitObject} commit - the parsed commit object
 * @property {string} payload - PGP signing payload
 */
/**
 * @typedef {Object} ServerRef - This object has the following schema:
 * @property {string} ref - The name of the ref
 * @property {string} oid - The SHA-1 object id the ref points to
 * @property {string} [target] - The target ref pointed to by a symbolic ref
 * @property {string} [peeled] - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
 */
/**
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */
/**
 * Normalized subset of filesystem `stat` data:
 *
 * @typedef {Object} Stat
 * @property {number} ctimeSeconds
 * @property {number} ctimeNanoseconds
 * @property {number} mtimeSeconds
 * @property {number} mtimeNanoseconds
 * @property {number} dev
 * @property {number} ino
 * @property {number} mode
 * @property {number} uid
 * @property {number} gid
 * @property {number} size
 */
/**
 * The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.
 *
 * @typedef {Object} WalkerEntry
 * @property {function(): Promise<'tree'|'blob'|'special'|'commit'>} type
 * @property {function(): Promise<number>} mode
 * @property {function(): Promise<string>} oid
 * @property {function(): Promise<Uint8Array|void>} content
 * @property {function(): Promise<Stat>} stat
 */
/**
 * @typedef {Object} CallbackFsClient
 * @property {function} readFile - https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
 * @property {function} writeFile - https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
 * @property {function} unlink - https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback
 * @property {function} readdir - https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback
 * @property {function} mkdir - https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback
 * @property {function} rmdir - https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback
 * @property {function} stat - https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback
 * @property {function} lstat - https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback
 * @property {function} [readlink] - https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback
 * @property {function} [symlink] - https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback
 * @property {function} [chmod] - https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback
 */
/**
 * @typedef {Object} PromiseFsClient
 * @property {Object} promises
 * @property {function} promises.readFile - https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
 * @property {function} promises.writeFile - https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
 * @property {function} promises.unlink - https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
 * @property {function} promises.readdir - https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
 * @property {function} promises.mkdir - https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
 * @property {function} promises.rmdir - https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path
 * @property {function} promises.stat - https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
 * @property {function} promises.lstat - https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
 * @property {function} [promises.readlink] - https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
 * @property {function} [promises.symlink] - https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
 * @property {function} [promises.chmod] - https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
 */
/**
 * @typedef {CallbackFsClient | PromiseFsClient} FsClient
 */
/**
 * @callback MessageCallback
 * @param {string} message
 * @returns {void | Promise<void>}
 */
/**
 * @typedef {Object} GitAuth
 * @property {string} [username]
 * @property {string} [password]
 * @property {Object<string, string>} [headers]
 * @property {boolean} [cancel] Tells git to throw a `UserCanceledError` (instead of an `HttpError`).
 */
/**
 * @callback AuthCallback
 * @param {string} url
 * @param {GitAuth} auth Might have some values if the URL itself originally contained a username or password.
 * @returns {GitAuth | void | Promise<GitAuth | void>}
 */
/**
 * @callback AuthFailureCallback
 * @param {string} url
 * @param {GitAuth} auth The credentials that failed
 * @returns {GitAuth | void | Promise<GitAuth | void>}
 */
/**
 * @callback AuthSuccessCallback
 * @param {string} url
 * @param {GitAuth} auth
 * @returns {void | Promise<void>}
 */
/**
 * @typedef {Object} SignParams
 * @property {string} payload - a plaintext message
 * @property {string} secretKey - an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys)
 */
/**
 * @callback SignCallback
 * @param {SignParams} args
 * @return {{signature: string} | Promise<{signature: string}>} - an 'ASCII armor' encoded "detached" signature
 */
/**
 * @typedef {Object} MergeDriverParams
 * @property {Array<string>} branches
 * @property {Array<string>} contents
 * @property {string} path
 */
/**
 * @callback MergeDriverCallback
 * @param {MergeDriverParams} args
 * @return {{cleanMerge: boolean, mergedText: string} | Promise<{cleanMerge: boolean, mergedText: string}>}
 */
/**
 * @callback WalkerMap
 * @param {string} filename
 * @param {WalkerEntry[]} entries
 * @returns {Promise<any>}
 */
/**
 * @callback WalkerReduce
 * @param {any} parent
 * @param {any[]} children
 * @returns {Promise<any>}
 */
/**
 * @callback WalkerIterateCallback
 * @param {WalkerEntry[]} entries
 * @returns {Promise<any[]>}
 */
/**
 * @callback WalkerIterate
 * @param {WalkerIterateCallback} walk
 * @param {IterableIterator<WalkerEntry[]>} children
 * @returns {Promise<any[]>}
 */
/**
 * @typedef {Object} RefUpdateStatus
 * @property {boolean} ok
 * @property {string} error
 */
/**
 * @typedef {Object} PushResult
 * @property {boolean} ok
 * @property {?string} error
 * @property {Object<string, RefUpdateStatus>} refs
 * @property {Object<string, string>} [headers]
 */
/**
 * @typedef {0|1} HeadStatus
 */
/**
 * @typedef {0|1|2} WorkdirStatus
 */
/**
 * @typedef {0|1|2|3} StageStatus
 */
/**
 * @typedef {[string, HeadStatus, WorkdirStatus, StageStatus]} StatusRow
 */
declare class GitPushError extends BaseError {
    /**
     * @param {string} prettyDetails
     * @param {PushResult} result
     */
    constructor(prettyDetails: string, result: PushResult);
    code: "GitPushError";
    name: "GitPushError";
    data: {
        prettyDetails: string;
        result: PushResult;
    };
}
declare namespace GitPushError {
    const code_6: 'GitPushError';
    export { code_6 as code };
}
declare class HttpError extends BaseError {
    /**
     * @param {number} statusCode
     * @param {string} statusMessage
     * @param {string} response
     */
    constructor(statusCode: number, statusMessage: string, response: string);
    code: "HttpError";
    name: "HttpError";
    data: {
        statusCode: number;
        statusMessage: string;
        response: string;
    };
}
declare namespace HttpError {
    const code_7: 'HttpError';
    export { code_7 as code };
}
declare class InternalError extends BaseError {
    /**
     * @param {string} message
     */
    constructor(message: string);
    code: "InternalError";
    name: "InternalError";
    data: {
        message: string;
    };
}
declare namespace InternalError {
    const code_8: 'InternalError';
    export { code_8 as code };
}
declare class InvalidFilepathError extends BaseError {
    /**
     * @param {'leading-slash'|'trailing-slash'|'directory'} [reason]
     */
    constructor(reason?: "leading-slash" | "trailing-slash" | "directory" | undefined);
    code: "InvalidFilepathError";
    name: "InvalidFilepathError";
    data: {
        reason: "leading-slash" | "trailing-slash" | "directory" | undefined;
    };
}
declare namespace InvalidFilepathError {
    const code_9: 'InvalidFilepathError';
    export { code_9 as code };
}
declare class InvalidOidError extends BaseError {
    /**
     * @param {string} value
     */
    constructor(value: string);
    code: "InvalidOidError";
    name: "InvalidOidError";
    data: {
        value: string;
    };
}
declare namespace InvalidOidError {
    const code_10: 'InvalidOidError';
    export { code_10 as code };
}
declare class InvalidRefNameError extends BaseError {
    /**
     * @param {string} ref
     * @param {string} suggestion
     * @param {boolean} canForce
     */
    constructor(ref: string, suggestion: string);
    code: "InvalidRefNameError";
    name: "InvalidRefNameError";
    data: {
        ref: string;
        suggestion: string;
    };
}
declare namespace InvalidRefNameError {
    const code_11: 'InvalidRefNameError';
    export { code_11 as code };
}
declare class MaxDepthError extends BaseError {
    /**
     * @param {number} depth
     */
    constructor(depth: number);
    code: "MaxDepthError";
    name: "MaxDepthError";
    data: {
        depth: number;
    };
}
declare namespace MaxDepthError {
    const code_12: 'MaxDepthError';
    export { code_12 as code };
}
declare class MergeNotSupportedError extends BaseError {
    code: "MergeNotSupportedError";
    name: "MergeNotSupportedError";
    data: {};
}
declare namespace MergeNotSupportedError {
    const code_13: 'MergeNotSupportedError';
    export { code_13 as code };
}
declare class MergeConflictError extends BaseError {
    /**
     * @param {Array<string>} filepaths
     * @param {Array<string>} bothModified
     * @param {Array<string>} deleteByUs
     * @param {Array<string>} deleteByTheirs
     */
    constructor(filepaths: string[], bothModified: string[], deleteByUs: string[], deleteByTheirs: string[]);
    code: "MergeConflictError";
    name: "MergeConflictError";
    data: {
        filepaths: string[];
        bothModified: string[];
        deleteByUs: string[];
        deleteByTheirs: string[];
    };
}
declare namespace MergeConflictError {
    const code_14: 'MergeConflictError';
    export { code_14 as code };
}
declare class MissingNameError extends BaseError {
    /**
     * @param {'author'|'committer'|'tagger'} role
     */
    constructor(role: "author" | "committer" | "tagger");
    code: "MissingNameError";
    name: "MissingNameError";
    data: {
        role: "author" | "committer" | "tagger";
    };
}
declare namespace MissingNameError {
    const code_15: 'MissingNameError';
    export { code_15 as code };
}
declare class MissingParameterError extends BaseError {
    /**
     * @param {string} parameter
     */
    constructor(parameter: string);
    code: "MissingParameterError";
    name: "MissingParameterError";
    data: {
        parameter: string;
    };
}
declare namespace MissingParameterError {
    const code_16: 'MissingParameterError';
    export { code_16 as code };
}
declare class MultipleGitError extends BaseError {
    /**
     * @param {Error[]} errors
     * @param {string} message
     */
    constructor(errors: Error[]);
    code: "MultipleGitError";
    name: "MultipleGitError";
    data: {
        errors: Error[];
    };
    errors: Error[];
}
declare namespace MultipleGitError {
    const code_17: 'MultipleGitError';
    export { code_17 as code };
}
declare class NoRefspecError extends BaseError {
    /**
     * @param {string} remote
     */
    constructor(remote: string);
    code: "NoRefspecError";
    name: "NoRefspecError";
    data: {
        remote: string;
    };
}
declare namespace NoRefspecError {
    const code_18: 'NoRefspecError';
    export { code_18 as code };
}
declare class NotFoundError extends BaseError {
    /**
     * @param {string} what
     */
    constructor(what: string);
    code: "NotFoundError";
    name: "NotFoundError";
    data: {
        what: string;
    };
}
declare namespace NotFoundError {
    const code_19: 'NotFoundError';
    export { code_19 as code };
}
declare class ObjectTypeError extends BaseError {
    /**
     * @param {string} oid
     * @param {'blob'|'commit'|'tag'|'tree'} actual
     * @param {'blob'|'commit'|'tag'|'tree'} expected
     * @param {string} [filepath]
     */
    constructor(oid: string, actual: "blob" | "tag" | "commit" | "tree", expected: "blob" | "tag" | "commit" | "tree", filepath?: string | undefined);
    code: "ObjectTypeError";
    name: "ObjectTypeError";
    data: {
        oid: string;
        actual: "blob" | "tag" | "commit" | "tree";
        expected: "blob" | "tag" | "commit" | "tree";
        filepath: string | undefined;
    };
}
declare namespace ObjectTypeError {
    const code_20: 'ObjectTypeError';
    export { code_20 as code };
}
declare class ParseError extends BaseError {
    /**
     * @param {string} expected
     * @param {string} actual
     */
    constructor(expected: string, actual: string);
    code: "ParseError";
    name: "ParseError";
    data: {
        expected: string;
        actual: string;
    };
}
declare namespace ParseError {
    const code_21: 'ParseError';
    export { code_21 as code };
}
declare class PushRejectedError extends BaseError {
    /**
     * @param {'not-fast-forward'|'tag-exists'} reason
     */
    constructor(reason: "not-fast-forward" | "tag-exists");
    code: "PushRejectedError";
    name: "PushRejectedError";
    data: {
        reason: "not-fast-forward" | "tag-exists";
    };
}
declare namespace PushRejectedError {
    const code_22: 'PushRejectedError';
    export { code_22 as code };
}
declare class RemoteCapabilityError extends BaseError {
    /**
     * @param {'shallow'|'deepen-since'|'deepen-not'|'deepen-relative'} capability
     * @param {'depth'|'since'|'exclude'|'relative'} parameter
     */
    constructor(capability: "shallow" | "deepen-since" | "deepen-not" | "deepen-relative", parameter: "depth" | "since" | "exclude" | "relative");
    code: "RemoteCapabilityError";
    name: "RemoteCapabilityError";
    data: {
        capability: "shallow" | "deepen-since" | "deepen-not" | "deepen-relative";
        parameter: "depth" | "since" | "exclude" | "relative";
    };
}
declare namespace RemoteCapabilityError {
    const code_23: 'RemoteCapabilityError';
    export { code_23 as code };
}
declare class SmartHttpError extends BaseError {
    /**
     * @param {string} preview
     * @param {string} response
     */
    constructor(preview: string, response: string);
    code: "SmartHttpError";
    name: "SmartHttpError";
    data: {
        preview: string;
        response: string;
    };
}
declare namespace SmartHttpError {
    const code_24: 'SmartHttpError';
    export { code_24 as code };
}
declare class UnknownTransportError extends BaseError {
    /**
     * @param {string} url
     * @param {string} transport
     * @param {string} [suggestion]
     */
    constructor(url: string, transport: string, suggestion?: string | undefined);
    code: "UnknownTransportError";
    name: "UnknownTransportError";
    data: {
        url: string;
        transport: string;
        suggestion: string | undefined;
    };
}
declare namespace UnknownTransportError {
    const code_25: 'UnknownTransportError';
    export { code_25 as code };
}
declare class UnsafeFilepathError extends BaseError {
    /**
     * @param {string} filepath
     */
    constructor(filepath: string);
    code: "UnsafeFilepathError";
    name: "UnsafeFilepathError";
    data: {
        filepath: string;
    };
}
declare namespace UnsafeFilepathError {
    const code_26: 'UnsafeFilepathError';
    export { code_26 as code };
}
declare class UrlParseError extends BaseError {
    /**
     * @param {string} url
     */
    constructor(url: string);
    code: "UrlParseError";
    name: "UrlParseError";
    data: {
        url: string;
    };
}
declare namespace UrlParseError {
    const code_27: 'UrlParseError';
    export { code_27 as code };
}
declare class UserCanceledError extends BaseError {
    code: "UserCanceledError";
    name: "UserCanceledError";
    data: {};
}
declare namespace UserCanceledError {
    const code_28: 'UserCanceledError';
    export { code_28 as code };
}
declare class UnmergedPathsError extends BaseError {
    /**
     * @param {Array<string>} filepaths
     */
    constructor(filepaths: string[]);
    code: "UnmergedPathsError";
    name: "UnmergedPathsError";
    data: {
        filepaths: string[];
    };
}
declare namespace UnmergedPathsError {
    const code_29: 'UnmergedPathsError';
    export { code_29 as code };
}
declare class IndexResetError extends BaseError {
    /**
     * @param {Array<string>} filepaths
     */
    constructor(filepath: any);
    code: "IndexResetError";
    name: "IndexResetError";
    data: {
        filepath: any;
    };
}
declare namespace IndexResetError {
    const code_30: 'IndexResetError';
    export { code_30 as code };
}
declare class FIFO {
    _queue: any[];
    write(chunk: any): void;
    _waiting: any;
    end(): void;
    _ended: boolean | undefined;
    destroy(err: any): void;
    error: any;
    async next(): Promise<any>;
}
declare function abbreviateRef(ref: any): any;
/**
 * @param {Buffer} delta
 * @param {Buffer} source
 * @returns {Buffer}
 */
declare function applyDelta(delta: any, source: any): any;
declare function arrayRange(start: any, end: any): any;
declare function assertParameter(name: any, value: any): void;
declare function basename(path: any): any;
declare class BufferCursor {
    constructor(buffer: any);
    buffer: any;
    _start: number;
    eof(): boolean;
    tell(): number;
    seek(n: any): void;
    slice(n: any): any;
    toString(enc: any, length: any): any;
    write(value: any, length: any, enc: any): any;
    copy(source: any, start: any, end: any): any;
    readUInt8(): any;
    writeUInt8(value: any): any;
    readUInt16BE(): any;
    writeUInt16BE(value: any): any;
    readUInt32BE(): any;
    writeUInt32BE(value: any): any;
}
declare function compareAge(a: any, b: any): number;
declare function compareRefNames(a: any, b: any): number;
declare function compareStats(entry: any, stats: any): boolean;
declare function compareStrings(a: any, b: any): number;
declare function compareTreeEntryPath(a: any, b: any): number;
declare class DeepMap {
    _root: any;
    set(keys: any, value: any): void;
    get(keys: any): any;
    has(keys: any): any;
}
declare function deflate(buffer: any): Promise<any>;
declare function dirname(path: any): any;
declare function emptyPackfile(pack: any): boolean;
declare function extractAuthFromUrl(url: any): {
    url: any;
    auth: {
        username?: undefined;
        password?: undefined;
    };
} | {
    url: any;
    auth: {
        username: any;
        password: any;
    };
};
declare function filterCapabilities(server: any, client: any): any;
declare function forAwait(iterable: any, cb: any): Promise<void>;
declare function formatAuthor({ name, email, timestamp, timezoneOffset }: {
    name: any;
    email: any;
    timestamp: any;
    timezoneOffset: any;
}): string;
/**
 * @param {any} remote
 * @param {string} prefix
 * @param {boolean} symrefs
 * @param {boolean} peelTags
 * @returns {ServerRef[]}
 */
declare function formatInfoRefs(remote: any, prefix: string, symrefs: boolean, peelTags: boolean): ServerRef[];
/**
 * @param {Map} map
 */
declare function fromEntries(map: any): {
    [x: string]: string;
};
declare function fromNodeStream(stream: any): any;
declare function fromStream(stream: any): any;
declare function fromValue(value: any): {
    next(): any;
    return(): {};
    [Symbol.asyncIterator](): any;
};
declare function getIterator(iterable: any): any;
declare function listpack(stream: any, onData: any): Promise<void>;
declare function hashObject({ gitdir, type, object }: {
    gitdir: any;
    type: any;
    object: any;
}): Promise<any>;
declare function indent(str: any): string;
declare function inflate(buffer: any): Promise<any>;
/**
 *
 * @param {number} mode
 */
declare function mode2type$1(mode: number): "blob" | "commit" | "tree";
/**
 *
 * @returns {Promise<void | {name: string, email: string, date: Date, timestamp: number, timezoneOffset: number }>}
 */
declare function normalizeAuthorObject({ fs, gitdir, author }: {
    fs: any;
    gitdir: any;
    author?: {} | undefined;
}): Promise<void | {
    name: string;
    email: string;
    date: Date;
    timestamp: number;
    timezoneOffset: number;
}>;
/**
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
declare function normalizeCommitterObject({ fs, gitdir, author, committer, }: {
    fs: any;
    gitdir: any;
    author: any;
    committer: any;
}): Promise<void | {
    name: string;
    email: string;
    timestamp: number;
    timezoneOffset: number;
}>;
/**
 * From https://github.com/git/git/blob/master/Documentation/technical/index-format.txt
 *
 * 32-bit mode, split into (high to low bits)
 *
 *  4-bit object type
 *    valid values in binary are 1000 (regular file), 1010 (symbolic link)
 *    and 1110 (gitlink)
 *
 *  3-bit unused
 *
 *  9-bit unix permission. Only 0755 and 0644 are valid for regular files.
 *  Symbolic links and gitlinks have value 0 in this field.
 */
declare function normalizeMode(mode: any): number;
declare function normalizeNewlines(str: any): any;
declare function normalizePath(path: any): any;
declare function normalizeStats(e: any): {
    ctimeSeconds: number;
    ctimeNanoseconds: number;
    mtimeSeconds: number;
    mtimeNanoseconds: number;
    dev: number;
    ino: number;
    mode: number;
    uid: number;
    gid: number;
    size: number;
};
declare function outdent(str: any): any;
declare function parseAuthor(author: any): {
    name: any;
    email: any;
    timestamp: number;
    timezoneOffset: any;
};
declare function posixifyPathBuffer(buffer: any): any;
declare function resolveBlob({ fs, cache, gitdir, oid }: {
    fs: any;
    cache: any;
    gitdir: any;
    oid: any;
}): any;
declare function resolveCommit({ fs, cache, gitdir, oid }: {
    fs: any;
    cache: any;
    gitdir: any;
    oid: any;
}): any;
declare function resolveFileIdInTree({ fs, cache, gitdir, oid, fileId }: {
    fs: any;
    cache: any;
    gitdir: any;
    oid: any;
    fileId: any;
}): Promise<any>;
declare function resolveFilepath({ fs, cache, gitdir, oid, filepath }: {
    fs: any;
    cache: any;
    gitdir: any;
    oid: any;
    filepath: any;
}): Promise<any>;
/**
 * Removes the directory at the specified filepath recursively. Used internally to replicate the behavior of
 * fs.promises.rm({ recursive: true, force: true }) from Node.js 14 and above when not available. If the provided
 * filepath resolves to a file, it will be removed.
 *
 * @param {import('../models/FileSystem.js').FileSystem} fs
 * @param {string} filepath - The file or directory to remove.
 */
declare function rmRecursive(fs: any, filepath: string): Promise<void>;
declare function splitLines(input: any): FIFO;
declare class StreamReader {
    constructor(stream: any);
    stream: any;
    buffer: any;
    cursor: any;
    undoCursor: any;
    started: boolean;
    _ended: boolean;
    _discardedBytes: number;
    eof(): boolean;
    tell(): any;
    async byte(): Promise<any>;
    async chunk(): Promise<any>;
    async read(n: any): Promise<any>;
    async skip(n: any): Promise<void>;
    async undo(): Promise<void>;
    async _next(): Promise<any>;
    _trim(): void;
    _moveCursor(n: any): void;
    async _accumulate(n: any): Promise<void>;
    async _loadnext(): Promise<void>;
    async _init(): Promise<void>;
}
declare function toHex(buffer: any): string;
declare function translateSSHtoHTTP(url: any): any;
declare function isPromiseLike(obj: any): boolean;
declare function isObject(obj: any): boolean;
declare function isFunction(obj: any): boolean;
declare function unionOfIterators(sets: any): {};
declare class BaseError extends Error {
    constructor(message: any);
    caller: string;
    toJSON(): {
        code: any;
        data: any;
        caller: string;
        message: string;
        stack: string | undefined;
    };
    fromJSON(json: any): BaseError;
    get isIsomorphicGitError(): boolean;
}
export { index as Errors, index$1 as Utils };
