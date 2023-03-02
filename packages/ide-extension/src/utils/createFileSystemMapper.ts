import * as vscode from "vscode";
import type { FS } from '@inlang/core/fs';

export function createFileSystemMapper(target: vscode.FileSystem, base: vscode.Uri): FS {
  return {
    readdir: async (path) => {
      return (await target.readDirectory(vscode.Uri.joinPath(base, path))).map(dir => dir[0]);
    },
    readFile: async (id) => {
      const rawFile = await target.readFile(vscode.Uri.joinPath(base, id));
      return new TextDecoder().decode(rawFile);
    },
    writeFile: async (file, data) => {
      return target.writeFile(vscode.Uri.joinPath(base, file), new TextEncoder().encode(data));
    }
  };
};
