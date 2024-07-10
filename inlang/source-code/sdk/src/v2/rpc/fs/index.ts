import "../setup.js"
import * as Comlink from "comlink"
import type { NodeishFilesystem } from "@lix-js/fs"

export function makeFsAvailableTo(fs: NodeishFilesystem, ep: Comlink.Endpoint) {
	Comlink.expose(fs, ep)
}

type FileChangeInfo = { eventType: "rename" | "change"; filename: string | null }

export function getFs(ep: Comlink.Endpoint): NodeishFilesystem {
	const _fs = Comlink.wrap<NodeishFilesystem>(ep)

	return {
		_createPlaceholder: _fs._createPlaceholder,
		_isPlaceholder: _fs._isPlaceholder,
		readlink: _fs.readlink,
		stat: _fs.stat,
		lstat: _fs.lstat,
		rm: _fs.rm,
		rmdir: _fs.rmdir,
		symlink: _fs.symlink,
		unlink: _fs.unlink,
		readdir: _fs.readdir,
		readFile: _fs.readFile as any,
		writeFile: _fs.writeFile,
		mkdir: _fs.mkdir,
		watch: async function* (path, options): AsyncIterable<FileChangeInfo> {
			yield* await _fs.watch(path, options)
		},
	}
}
