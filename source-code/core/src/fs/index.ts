import type { PathLike, OpenMode } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import type { Stream } from 'node:stream';

type Options = ({
  encoding?: null | undefined;
  flag?: OpenMode | undefined;
});

export type readFile = (id: PathLike | FileHandle, options?: Options) => Promise<string | Buffer>;
export type writeFile = (file: PathLike | FileHandle, data: string | Stream) => Promise<void>;
export type readdir = (path: PathLike) => Promise<string[] | Buffer[]>;
