import _git from "isomorphic-git"
import _http from "isomorphic-git/http/web/index.js"
import { createNodeishMemoryFs } from "@inlang-git/fs"
import type { NodeishFilesystem } from "@inlang-git/fs"
import { github } from "./github.js"
import { wrap, transformRemote } from "./helpers.js"

/**
 * Raw git cli api. (Used for legacy migrations)
 *
 * Used for legacy migrations. The idea of the `git-sdk` is to abstract working with git as
 * a CLI. Sometimes access to the "raw" git CLI is required to
 * achieve actions that are unsupported, or not yet, supported
 * by the `git-sdk`. Esepcially useful for faster development
 * iterations and progressively develop own api layer on top.
*/
export const raw = _git

/**
  * The http client for the git raw api. (Used for legacy migrations)
  *
  * Note: The http client is web-based. Node version 18 is
  * required for the http client to work in node environments.
*/
export const http = _http

export type Repository = {
	fs: NodeishFilesystem
	commit: (args: { dir: string, author: any, message: string}) => Promise<Awaited<ReturnType<typeof raw.commit>> | undefined>
	push: (args: { dir: string }) => Promise<Awaited<ReturnType<typeof raw.push>> | undefined>
	pull: (args: { dir: string, author: any, fastForward: boolean, singleBranch: true }) => any
  add: (args: { dir: string, filepath: string }) =>  Promise<Awaited<ReturnType<typeof raw.add>>>
	listRemotes: () => Promise<Awaited<ReturnType<typeof raw.listRemotes>> | undefined>
	log: (args: { dir: string, since: any}) =>  Promise<Awaited<ReturnType<typeof raw.log>>>
  statusMatrix: (args: { dir:string, filter: any }) => Promise<Awaited<ReturnType<typeof raw.statusMatrix>>>
  mergeUpstream: (args: { branch: string }) => ReturnType<typeof github.request<"POST /repos/{owner}/{repo}/merge-upstream">>
  isCollaborator: (args: { username: string }) => Promise<boolean>
  getOrigin: () => Promise<string>
  getCurrentBranch: () => Promise<string | undefined>
  getMeta: () => Promise<{
    name: string,
    isPrivate: boolean,
    isFork: boolean,
    owner: { name?: string, email?: string },
    parent:  {
      url: string,
      fullName: string
    } | undefined
  }>

  // TODO: implement these before publishing api, but not used in badge or editor
  // currentBranch: () => unknown
	// changeBranch: () => unknown
  // status: () => unknown
}

export function load ({ url, fs, corsProxy }: { url: string, fs?: NodeishFilesystem, path?: string, corsProxy?: string, auth?: unknown }): Repository {
  const rawFs = fs ? fs : createNodeishMemoryFs()

  // parse url in the format of github.com/inlang/example and split it to host, owner and repo
  const [host, owner, repoName] = [...url.split("/")]

  // check if all 3 parts are present, if not, return an error
  if (!host || !owner || !repoName) {
    throw new Error(
      `Invalid url format for '${url}' for cloning repository, please use the format of github.com/inlang/example.`,
    )
  }

  const normalizedUrl = `https://${host}/${owner}/${repoName}`

  let pending: Promise<void> | undefined = raw.clone({
    fs: wrap(rawFs, 'clone'),
    http,
    dir: "/",
    corsProxy,
    url: normalizedUrl,
    singleBranch: true,
    depth: 1,
    noTags: true,
  }).finally(() => {
    pending = undefined
  }).catch((err: any) => {
    console.error('error cloning the repository', err)
  })

  return {
    fs: wrap(rawFs, 'app', (_prop, [callTarget, thisArg, argumentsList]) => {
      if (pending) {
        return pending.then(() => Reflect.apply(callTarget, thisArg, argumentsList))
      }

      return Reflect.apply(callTarget, thisArg, argumentsList)
    }),

    /**
     * Gets the git origin url of the current repository.
     *
     * @returns The git origin url or undefined if it could not be found.
     */
    async listRemotes () {
      try {
        const wrappedFS = wrap(rawFs, 'listRemotes')

        const remotes = await raw.listRemotes({
          fs: wrappedFS,
          dir: await raw.findRoot({
            fs: wrappedFS,
              filepath: "/"
          }),
        })

        return remotes
      } catch (_err) {
        return undefined
      }
    },

    statusMatrix ({ dir = "/", filter }) {
      return raw.statusMatrix({
        fs: wrap(rawFs, 'statusMatrix'),
        dir,
        filter
      })
    },

    add ({ dir = "/", filepath }) {
      return raw.add({
        fs: wrap(rawFs, 'add'),
        dir,
        filepath
      })
    },

    commit ({ dir = "/", author, message }) {
      return raw.commit({
        fs: wrap(rawFs, 'commit'),
        dir,
        author,
        message
      })
    },

    push ({ dir = "/" }) {
      return raw.push({
        fs: wrap(rawFs, 'push'),
        url: normalizedUrl,
        corsProxy,
        http,
        dir
      })
    },

    pull ({ dir = "/", author, fastForward, singleBranch }) {
      return raw.pull({
        fs: wrap(rawFs, 'pull'),
        url: normalizedUrl,
        corsProxy,
        http,
        dir,
        fastForward,
        singleBranch,
        author
      })
    },

    log ({ dir = "/", since }) {
      return raw.log({
        fs: wrap(rawFs, 'log'),
        dir,
        since
      })
    },

    mergeUpstream ({ branch }) {
      return github.request("POST /repos/{owner}/{repo}/merge-upstream", {
      	branch,
      	owner,
      	repo: repoName,
      })
    },

    async isCollaborator ({ username }) {
      let response: Awaited<ReturnType<typeof github.request<"GET /repos/{owner}/{repo}/collaborators/{username}">>> | undefined
      try {
        response = await github.request(
          "GET /repos/{owner}/{repo}/collaborators/{username}",
          {
            owner,
            repo: repoName,
            username,
          },
        )
      } catch (_err) { /* throws on non collaborator access */ }

      return response?.status === 204 ? true : false
    },

    /**
     * Parses the origin from remotes.
     *
     * The function ensures that the same orgin is always returned for the same repository.
     */
    async getOrigin (): Promise<string> {
      const remotes = await this.listRemotes()
      // 	remotes: Array<{ remote: string; url: string }> | undefined
      // }): string {
      const origin = remotes?.find((elements) => elements.remote === "origin")
      if (origin === undefined) {
        return "unknown"
      }
      // polyfill for some editor related origin issues
      let result = origin.url
      if (result.endsWith(".git") === false) {
        result += ".git"
      }

      return transformRemote(result)
    },

    async getCurrentBranch () {
      // TODO: make stateless?, migrate to getMainBranch
      return await raw.currentBranch({
        fs: wrap(rawFs, 'getMainBranch'),
        dir: "/",
      }) || undefined
    },

     /**
     * Additional information about a repository provided by GitHub.
     */
     async getMeta () {
      const { data: { name, private: isPrivate, fork: isFork, parent, owner: ownerMetaData }}: Awaited<ReturnType<typeof github.request<"GET /repos/{owner}/{repo}">>> = await github
        .request("GET /repos/{owner}/{repo}", {
          owner,
          repo: repoName,
        })

        return {
          name,
          isPrivate,
          isFork,
          owner: { name: ownerMetaData.name || undefined, email: ownerMetaData.email || undefined},
          parent: parent ? {
            url: transformRemote(parent.git_url),
            fullName: parent.full_name
          } : undefined
        }
    },
  }
}
