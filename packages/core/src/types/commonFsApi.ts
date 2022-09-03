// node fs
import type fs from 'fs';
// browser fs
import type { PromisifiedFS } from '@isomorphic-git/lightning-fs';

/**
 * Common fs api of node and browser.
 *
 * Limited by the api available in the browser (https://github.com/isomorphic-git/isomorphic-git).
 */
export type CommonFsApi = {
    /** Reads File Content from Disk */
    readFile(path: string): Promise<string | Buffer | Uint8Array>;
    /** Writes File Content to Disk */
    writeFile(filePath: string, data: Uint8Array, opts?: WriteFileOpts): Promise<void>;
    /** Remove File from Disk */
    unlink(filePath: string): Promise<void>;
    /** Lists all files and sub-directory in given directory Path */
    readdir(filePath: string): Promise<string[]>;
    /** Creates Directory in Disk for given Path */
    mkdir(filePath: string, opts?: DirOpts): Promise<void>;
    /** Remove Directory from Disk */
    rmdir(filePath: string): Promise<void>;
    /** Rename File Name in Disk */
    rename(oldFilepath: string, newFilepath: string): Promise<void>;
    /** Unix File Stat from Disk */
    stat(filePath: string): Promise<fs.Stats>;
    /** Unix File Stat from Disk */
    lstat(filePath: string): Promise<fs.Stats>;
    /** Read Content of file targeted by a Symbolic Link */
    readlink(filePath: string): Promise<string>;
    /** Create Symbolic Link to a target file */
    symlink(target: string, filePath: string): Promise<void>;
};

interface ReadFileOpts {
    /** Encoding of Data */
    encoding: 'utf8';
}
interface ReadFileOpts {
    /** Encoding of Data */
    encoding: 'utf8';
}

interface WriteFileOpts {
    /** Encoding of Data */
    encoding?: 'utf8' | undefined;
    /** Unix Octet Represenation of File Mode */
    mode: number;
}

interface DirOpts {
    /** Unix Octet Represenation of File Mode */
    mode?: number | undefined;
}
