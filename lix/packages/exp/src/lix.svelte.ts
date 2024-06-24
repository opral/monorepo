// @ts-nocheck
import { openRepository, inflatePackfile, throttle, formatTime } from '@lix-js/client' // '/Users/jan/Dev/inlang/inlang/lix/source-code/client/src/index.ts'

export { formatTime }

// TODO: global action queue like ISL
export function openRepo (url, { ref, author }) {
  // rememeber: what if the changes come from the filesystme form other process, only reacting in here does not help there
  const files = new Map()

  let repoAvailable
  const repoProm = new Promise((resolve) => { repoAvailable = resolve })
  let branches = $state([])

  // get git notes
  let depth = 1

  // move this to component ! as $state(openRepo...)?
  const state = $state({
    paths: [], 
    
    listBranches: async function () {
      await updateRefs()
    },

    repo: null,
    
    get branches () { // > no need for getter here repo.branches()
      return branches
    },
    
    refs: {
      head: {},
      baseBranch: {},
    },
    
    exclude: [],
    commits: [],
    unpushed: 0,
    filepath: undefined,

    files: function (path) {
      console.log('files get', path)
      if (files.has(url + ref + path)) {
        return files.get(url + ref + path)
      }

      let fileContent = $state(undefined)
      const file = {
        fileContent,
        
        get loading () {
          return false
        },
        
        get content () {
          if (fileContent === undefined) {
            console.log('files content getter setup:', path)

            fileContent = ""
            
            repoProm.then(async (repo) => {
              if (path.startsWith('.git/') && path.endsWith('.pack')) { 
                const packfile = await repo.nodeishFs.readFile(path, { encoding: 'binary' })

                const packContent = await inflatePackfile(packfile, { minimal: true })
                console.log(path, packContent)
                fileContent = JSON.stringify(packContent, null, 2)
              } else {
                fileContent = await repo.read(path)
              }              
               
              console.log('initial get content and watcher setup', path)
              
              setTimeout(() => state.status.push([path, 'unmodified']), 0)
            })
          }

          return fileContent
        },
        
        set content (val) {
          fileContent = val
          repoProm.then((repo) => repo.write(path, val).then(() => setTimeout(updateStatusList, 0)))
        }
      }

      console.log('files set', url + ref + path)
      files.set(url + ref + path, file)

      return file
    },

    pull: async function () {
      const repo = await repoProm
      await repo.pull({
        fastForward: true,
        singleBranch: true,
      })
      await updateLogs()
    },

    checkout: async function (args) {
      const repo = await repoProm
      console.log('checkout', args)
      await repo.checkout(args).then(console.log)
      
      await updateLogs()
      await updateFiles()
      await updateStatusList()
    },

    readNote: async function (params) {
      const repo = await repoProm
      return await repo.readNote(params).catch(() => {})
    },

    async nextPage () { 
      depth = depth + 10
      const repo = await repoProm
      await repo.fetch({ depth: 10, relative: true, debug: false, noTrees: true })
      updateLogs()
    },

    clear () {
      depth = 1
      updateLogs()
    },

    fetch: async function () {
      const repo = await repoProm

      // FIXME: make cache opt in not opt out?
      console.time('fetch')
      // for generic refetch add notes update to the request
      // FIXME: enable notes suppport as well as fork status on per repo level. use since for notes!
      await Promise.all([
        repo.fetch({ depth: 1, ref: 'refs/notes/checks', remoteRef: 'refs/notes/checks', singleBranch: true, noBlobs: false, noCache: true }).catch((err) => {err}),
        repo.fetch({ debug: false, depth: 1, remoteRef: 'refs/heads/*', singleBranch: false, noCache: true, noTrees: true }),
        // repo.fetch() refresh only
      ])
      console.timeEnd('fetch')

      await updateLogs()
    },

    push: async function () {
      const repo = await repoProm

      console.time('push')
      try {
        await repo.push()
      } catch (err) { }
      console.timeEnd('push')

      depth = depth + 1

      await updateLogs()
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

      await updateStatusList()
      depth = depth + 1
      await updateLogs().then(() => (state.exclude = []))

      await state.repo.push().catch(console.error)
      await updateLogs()

      // message = `Changes on {ref} started ${new Date().toUTCString()}`
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
    ref,
    author, // TODO: check with git config
    // sparseFilter: ({ filename, type }) => type === 'folder' || filename.endsWith('.md')
  }).then(async (newRepo) => {
    state.repo = newRepo
    repoAvailable(newRepo)
    window.repo = state.repo

    console.timeEnd('openRepo')

    await updateCoreRefs()
    await updateStatusList()
    await updateLogs()
    await updateFiles()
    await updateRefs()

    setTimeout(async () => {
      await state.fetch()

      for await (const change of newRepo.nodeishFs.watch('/', { recursive: true })) { 
        if (change.filename.startsWith('.git/') && !change.filename.startsWith('.git/objects/') && change.filename !== '.git/index') {
          const newContent = await newRepo.read(change.filename)
          console.log('watcher', change.filename, newContent.split('\n')) // updateCore refs selectively
        }

        if (files.has(url + ref + change.filename)) {
          const file = files.get(url + ref + change.filename)
          file.fileContent = await newRepo.read(change.filename)
          console.log('watch trigger', change, change.filename)
        }

        await updateFiles()
      }
    }, 0)
  })

  // TODO: ui test for independent rerender of differnet head refs from file watcher reactivity
  async function updateCoreRefs () {
    console.time('coreRefs')
    const refsRes = await Promise.all([
      repo.resolveRef({ ref: "HEAD", depth: 2 }),
      repo.resolveRef({ ref: "HEAD", depth: 3 }),
      repo.resolveRef({ ref: "refs/remotes/origin/HEAD", depth: 2 }),
      repo.resolveRef({ ref: "refs/remotes/origin/HEAD", depth: 3 }),
    ])
    
    state.refs = {
      head: {
        ref: refsRes[0],
        oid: refsRes[1],
      },
      baseBranch: {
        ref: refsRes[2],
        oid: refsRes[3],
      },
    }
    
    console.timeEnd('coreRefs')
    console.log(state.refs)
  }

  async function updateRefs () {
    console.time('refs')
    const repo = await repoProm
    // TODO: PUll requests
    // await repo.fetch({ depth: 1, ref: 'refs/pull/2/head',  remoteRef: 'refs/pull/2/head', singleBranch: true }).catch((err) => {err})
    
    const [remRefs, locRefs] = await Promise.all([
      repo.listBranches({ remote: 'origin' }),
      repo.listBranches()
    ]) // ref: 'refs/remotes/origin/*', ,

    const localRefs = (await Promise.all(locRefs.map(async branch => {
      const commit = (await repo.log({ ref: 'refs/heads/' + branch, depth: 1 }))[0]
    
      return {
        ...commit,
        local: true,
        branchName: branch,
        ref: 'refs/heads/' + branch,
      }
    }))).reduce((agg, com) => {
      agg[com.branchName] = com
      return agg
    }, {})
    
    // .sort((a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp)
    
    const remoteRefs = {}
    await Promise.all(remRefs.filter(branch => branch !== 'HEAD' && !branch.startsWith('gh-readonly-queue/')).map(async branch => {
      const commitData = (await repo.log({ ref: 'refs/remotes/origin/' + branch, depth: 1 }))[0]
      
      const commit = {
        ...commitData,
        branchName: branch,
        ref: 'refs/remotes/origin/' + branch,
      }

      if (localRefs[branch]) {
        if (commit.oid === localRefs[branch].oid) {
          localRefs[branch].origin = true
        } else if (commit.commit.committer.timestamp > localRefs[branch].commit.committer.timestamp) {
          commit.origin = true
          commit.local = true
          commit.unsynced = truel
          localRefs[branch] = commit
         
        } else {
          localRefs[branch].origin = true
          localRefs[branch].unsynced = true
        }
      } else {
        commit.origin = true
        remoteRefs[branch] = commit
      }
    }))
    
    const currentDate = new Date()
    const halfYearAgo = currentDate.setMonth(currentDate.getMonth() - 12)
    let oldLocal = 0
    let oldOrigin = 0
    branches = [
      ...Object.values(localRefs)
        .filter(com => {
          if (com.commit.committer.timestamp < (halfYearAgo / 1000)) {
            oldLocal++
            return false
          }
          return true
        })
        .sort((a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp),
      ...(oldLocal ? [{ title: `(${oldLocal} branches older than 12 months)`, skip: true}] : []),
      
      { title: '', skip: true}, 
      
      ...Object.values(remoteRefs)
        .filter(com => {
          if (com.commit.committer.timestamp < (halfYearAgo / 1000)) {
            oldOrigin++
            return false
          }
          return true
        })
        .sort((a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp),
      ...(oldOrigin ? [{ title: `(${oldOrigin} branches older than 12 months)`, skip: true}] : []),
    ].map((com) => {
      if (com.skip) {
        return com
      }

      com.title = com.branchName + `${ com.commit ? ' (' +  com.commit.author?.name + ', ' + formatTime(com.commit.author.timestamp) + ')' : ''}`
      if (com.unsynced) {
        com.title += ' unsynced changes ❗️'
      }
      return com
    })

    // console.log('asdf', branches)
    console.timeEnd('refs')
    // TODO: reactivity: needs to be exposed but only executed when used in ui > revisit samuels proxy requirement!
  }

  async function updateStatusList () {
    console.time('statusList')
    state.status = await state.repo.statusList({ includeStatus: ['materialized'] })
    console.timeEnd('statusList')
  }

  const updateFiles = throttle(async function () {  
    console.time('files')
    state.paths = (await state.repo.listDir('/', { recursive: true })).sort()
    console.timeEnd('files')
  }, 500)

  async function updateLogs() {
    console.time('logs')
    if (!state.repo) {
      return
    }
    // since: new Date(currentCommits[0].committer.timestamp * 1000) // TODO: log all origin commits from mergebase, or dont use same branch for local commits until publishing

    // TODO: support for disjunkt "per file history" entries and prebundling the merge branch commits instead of dropping them!

    const mergeBranches = {}
    
    const allOriginCommits = (await state.repo.log({ ref: state.refs.baseBranch.ref, depth, filepath: state.filepath })) // 'refs/remotes/origin/main'
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

    const allHeadCommits = await state.repo.log({ depth, ref: state.refs.head.ref, filepath: state.filepath })
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

    const shallows = new Set((await state.repo.read('.git/shallow').catch(() => '')).split('\n').filter(Boolean))

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
        if (shallows.has(com.oid)) {
          com.shallow = true
        }
      return com
    })

    let newUnpushed = Object.values(headIndex).filter(com => com.headOnly).length

    // console.log(commits.map(com => ({ oid: com.oid, current: com.current, origin: com.origin, parent: [...com.commit.parent] })))
    // console.log({mergeBranches})
    
    state.commits = commits
    state.mergeBranches = mergeBranches // used for expanding merge commits
    state.unpushed = newUnpushed
   
    console.timeEnd('logs')
  }

  return state
}

// todo: check fs/ worker/ tab/ network service / sync, sound around invalidations?
