// @ts-nocheck
import { openRepository } from '@lix-js/client' // '/Users/jan/Dev/inlang/inlang/lix/source-code/client/src/index.ts'
// rememeber: what if the changes come from the filesystme form other process, only reacting in here does not help there
const files = new Map()

export function openRepo (url, { branch, author }) {
  let repoAvailable
  const repoProm = new Promise((resolve) => {repoAvailable = resolve})
  let branches = $state([branch])

  // get git notes
  let depth = 1
  console.log('repo o', {depth})

  // move this to component ! as $state(openRepo...)?
  const state = $state({
    folders: [], // >> files()
    
    fetchRefs: async function () {
      return branches?.length < 2 && repoProm.then((repo)=> repo.getBranches().then(br => {
        branches = br
      })) // TODO: reactivity: needs to be exposed but only executed when used in ui > revisit samuels proxy requirement!
    },

    repo: null,
    get branches () { // > no need for getter here repo.branches()
      return branches
    },
    currentBranch: '',
    exclude: [],
    commits: [],
    unpushed: 0,
    filepath: undefined,

    files: function (path) {
      let fileContent = $state('')

      return {
        get loading () {
          return false
        },
        
        get content () {
          if (!fileContent?.length) {
            repoProm.then((repo) => {
              repo.read(path).then(async (content) => {
                console.log('exp get content', path )
                fileContent = content
                
                setTimeout(() => updateStatus([path, 'unmodified']), 0)
                
                for await (const change of repo.nodeishFs.watch(path)) {
                  await repo.read(path).then(newContent => fileContent = newContent).catch(() => {})
                  // console.log(change, fileContent)
                }
              })
            })
          } 
          return fileContent
        },
        
        set content (val) {
          fileContent = val
          repoProm.then((repo) => repo.write(path, val).then(() => setTimeout(updateStatus, 0)))
        }
      }
    },

    updateStatus: async function () {
      await updateStatus()
    },

    pull: async function () {
      const repo = await repoProm
      await repo.pull({
        fastForward: true,
        singleBranch: true,
      })
      await updateStatus()
    },

    readNote: async function (params) {
      const repo = await repoProm
      return await repo.readNote(params)
    },

    async nextPage () { 
      depth = depth + 10
      const repo = await repoProm
      await repo.fetch({ depth: 10, relative: true })
      updateStatus()
    },

    clear () {
      depth = 1
      updateStatus()
    },

    fetch: async function (args) {
      const repo = await repoProm

      if (!args) {
        // for generic refetch add notes update to the request
        // FIXME: enable notes suppport as well as fork status on per repo level. use since for notes!
        await Promise.all([
          repo.fetch({ depth: 1, ref: 'refs/notes/commits',  remoteRef: 'refs/notes/commits', singleBranch: true }).catch((err) => {err}),
          repo.fetch()
        ])

        await repo.fetch({ depth: 1, ref: 'refs/pull/2/head',  remoteRef: 'refs/pull/2/head', singleBranch: true }).catch((err) => {err})
      } else {
        await repo.fetch(args)
      }
      
      await updateStatus()
    },

    push: async function () {
      console.time('repoAvail')
      const repo = await repoProm
      console.timeEnd('repoAvail')

      console.time('push')
      await repo.push()
      console.timeEnd('push')

      depth = depth + 1

      await updateStatus()
    },

    addExclude: function (entry) {
      state.exclude.push(entry)
      state.exclude = state.exclude
    },

    include: async function (entry) {
      state.exclude = state.exclude.filter((excl) => excl !== entry)
    },

    commit: async function (message) {
      const includedFiles = state.status
        .filter(([name, txt]) => txt !== 'unmodified' && !state.exclude.includes(name))
        .map(([name]) => name)

      console.time('commit', { includedFiles })
      await state.repo.commit({ message, include: includedFiles })
      console.timeEnd('commit')

      depth = depth + 1
      await updateStatus().then(() => (state.exclude = []))

      await state.repo.push().catch(console.error)
      await updateStatus()

      // message = `Changes on ${currentBranch} started ${new Date().toUTCString()}`
    }
  })

  console.time('openRepo')
  openRepository(url, {
    debug: false,
    experimentalFeatures: {
      lixFs: true,
      lazyClone: true,
      lixCommit: true,
      lixMerge: true
    },
    // nodeishFs: createNodeishMemoryFs(),
    // auth: browserAuth
    branch,
    author, // TODO: check with git config
    // sparseFilter: ({ filename, type }) => type === 'folder' || filename.endsWith('.md')
  }).then(async (newRepo) => {
    state.repo = newRepo
    window.repo = state.repo
    repoAvailable(newRepo)

    state.currentBranch = await state.repo.getCurrentBranch()
    console.info('currentBranch', state.currentBranch)
    console.timeEnd('openRepo')

    updateStatus()
  })

  async function updateStatus(addStatus) {
    if (!state.repo) {
      return
    }
    if (addStatus) {
      state.status.push(addStatus)
    } else {
      console.time('statusList')
      state.status = await state.repo.statusList({ includeStatus: ['materialized'] })
      console.timeEnd('statusList')

      // since: new Date(currentCommits[0].committer.timestamp * 1000) // TODO: log all origin commits from mergebase, or dont use same branch for local commits until publishing

      // TODO: support for disjunkt "per file history" entries and prebundling the merge branch commits instead of dropping them!

      const mergeBranches = {}
      
      const allOriginCommits = (await state.repo.log({ ref: 'origin/' + state.currentBranch, depth, filepath: state.filepath })) // 'refs/remotes/origin/'
      const originIndex = allOriginCommits.reduce((agg, com) => {
        agg[com.oid] = com
        return agg
      }, {})

      // remove the non first parent merge branch commits
      const originCommits = []
      let nextCommit = allOriginCommits[0].oid
      while (originIndex[nextCommit]) {
        const com = originIndex[nextCommit]
        com.primary = true
        originCommits.push(com)
        
        let rest
        [nextCommit, ...rest] = com.commit.parent
        if (rest?.length) {
          mergeBranches[com.oid] = rest.map((oid) => {
            if (!originIndex[oid]) {
              return [{ oid }]
            }
            originIndex[oid].mergeBranch = true
            return [originIndex[oid]]
          })
        }
      }

      // TODO: Move over all children of merge commits that are not primaries to the mergeBranches


      const allHeadCommits = await state.repo.log({ depth, ref: 'HEAD', filepath: state.filepath })
      const headIndex = allHeadCommits.reduce((agg, com) => {
        agg[com.oid] = com
        if (!originIndex[com.oid]) {
          com.headOnly = true
        }
       
        return agg
      }, {})

      // remove the non first parent merge branch commits
      const headCommits = []
      let nextHeadCommit = allHeadCommits[0].oid
      while (headIndex[nextHeadCommit] && headIndex[nextHeadCommit].headOnly) {
        const com = headIndex[nextHeadCommit]
        headCommits.push(com)

        let rest
        [nextHeadCommit, ...rest] = com.commit.parent
        if (rest?.length) {
          mergeBranches[com.oid] = rest.map((oid) => {
            if (!headIndex[oid]) {
              return [ { oid }]
            }
            headIndex[oid].mergeBranch = true
            return [headIndex[oid]]
          })
        }
      }

      // move the origin commits to the head branch that were cut off from end of origin branch
      let lastOriginCommitParent = originCommits.at(-1)?.commit.parent[0]
      while (headIndex[lastOriginCommitParent] && headIndex[lastOriginCommitParent].headOnly) {
        originCommits.push(headIndex[lastOriginCommitParent])
        delete headIndex[lastOriginCommitParent]
        lastOriginCommitParent = originCommits.at(-1)?.commit.parent[0]
      }

      // fixme: apply this on final array in case these are the same or replaced
      // const originHead = originCommits[0].oid
      const localHead = allHeadCommits[0].oid
      
      originCommits[0].origin = true

      const commits = [
        ...headCommits.flatMap((com) => {
          if (!headIndex[com.oid]) {
            return []
          }
          com.indent = 1
          return com
        }), 
        ...originCommits
      ].map((com) => {
          if (com.oid === localHead) {
            com.current = true
          }
        return com
      })

      let newUnpushed = Object.values(headIndex).filter(com => com.headOnly).length

      console.log(commits.map(com => ({ oid: com.oid, current: com.current, origin: com.origin, parent: [...com.commit.parent] })))
      console.log({mergeBranches})
      state.commits = commits
      state.mergeBranches = mergeBranches // used for expanding merge commits
      state.unpushed = newUnpushed

      // console.time('folders')
      const folderList = (await state.repo.listDir('/')).sort()
      state.folders = await Promise.all(
        (folderList).map(async (name) => ({
          name,
          type: (await state.repo.nodeishFs.stat('/' + name)).isDirectory() ? '📂' : '📄'
        }))
      )
      // console.timeEnd('folders')
    }
  }

  return state
}

// todo: check fs/ worker/ tab/ network service / sync, sound around invalidations?
