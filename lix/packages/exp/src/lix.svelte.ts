// @ts-nocheck
import { openRepository } from '@lix-js/client' // '/Users/jan/Dev/inlang/inlang/lix/source-code/client/src/index.ts'
// rememeber: what if the changes come from the filesystme form other process, only reacting in here does not help there
const files = new Map()

export function openRepo (url, { branch, author }) {
  let repoAvailable
  const repoProm = new Promise((resolve) => {repoAvailable = resolve})
  let branches = $state([branch])

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

    pull: async function () {
      const repo = await repoProm
      await repo.pull({
        fastForward: true,
        singleBranch: true,
      })
      await updateStatus()
    },

    push: async function () {
      console.time('repoAvail')
      const repo = await repoProm
      console.timeEnd('repoAvail')

      console.time('push')
      await repo.push()
      console.timeEnd('push')

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
      lixCommit: true
    },
    // nodeishFs: createNodeishMemoryFs(),
    // auth: browserAuth
    branch,
    author, // TODO: check with git config
    // sparseFilter: ({ filename, type }) => type === 'folder' || filename.endsWith('.md')
  }).then(async (newRepo) => {
    // @ts-ignore
    window.repo = state.repo
    state.repo = newRepo
    repoAvailable(newRepo)

    state.currentBranch = await state.repo.getCurrentBranch()
    console.log('currentBranch', state.currentBranch)
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
      // Console.log(await repo.log({ filepath: '.npmrc' }))

      // console.time('double log')
      const originCommits = (await state.repo.log({ ref: 'origin/' + state.currentBranch, depth: 15 })).reduce((agg, com) => {
        agg[com.oid] = true
        return agg
      }, {})

      let newUnpushed = 0
      // ...await state.repo.log({  ref: 'refs/remotes/origin/' + state.currentBranch, depth: 5})
      let foundOrigng= false
      let currentCommitOid
      state.commits = ([...await state.repo.log({ depth: 15 })]).map((com) => {
        if (!currentCommitOid) {
          currentCommitOid = com.oid
          com.current = true
        }
        if (originCommits[com.oid]) {
          if (!foundOrigng) {
            foundOrigng = true
            com.origin = true
          }
        } else {
          newUnpushed++
        }
        return com
      })
      // console.timeEnd('double log')
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
