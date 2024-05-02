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
    
    repo: null,
    get branches () { // > no need for getter here repo.branches()
      // !branches?.length && repoProm.then((repo: any)=> repo.getBranches().then(br => { 
      //   // console.log(br)
      //   branches = br
      // })) // TODO: reactivity: needs to be exposed but only executed when used in ui > revisit samuels proxy requirement!
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
          // console.log('reading file ' + path)
          
          !fileContent?.length && repoProm.then((repo: any) => repo.read(path).then((content) => {
            fileContent = content
            setTimeout(updateStatus, 0)
          }))
          return fileContent
        },
        
        set content (val) {
          fileContent = val
          repoProm.then((repo: any) => repo.write(path, val).then(() => setTimeout(updateStatus, 0)))
        }
      }
    },

    pull: async function () {
      const repo: any = await repoProm
      await repo.pull({
        fastForward: true,
        singleBranch: true,
      })
      await updateStatus()
    },

    push: async function () {
      const repo: any = await repoProm
      await repo.push()
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

      console.log('commit', { includedFiles })
      await state.repo.commit({ message, include: includedFiles })
      await state.repo.push().catch(console.error)
      await updateStatus().then(() => (state.exclude = []))
      // message = `Changes on ${currentBranch} started ${new Date().toUTCString()}`
    }
  })

  console.time('lix')
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
    state.repo = newRepo
    repoAvailable(newRepo)

    // @ts-ignore
    window.repo = state.repo

    state.currentBranch = await state.repo.getCurrentBranch()
    console.log('currentBranch', state.currentBranch)
    state.commits = await state.repo.log()

    // content = await repo.files.read('/README.md')
    // console.log('listing files')
    const folderList = await state.repo.listDir('/')
    
    // console.log({ folderList })
    
    state.folders = await Promise.all(
      (folderList).map(async (name) => ({
        name,
        type: (await state.repo.nodeishFs.stat('/' + name)).isDirectory() ? '📂' : '📄'
      }))
    )

    updateStatus()

    console.timeEnd('lix')
  })

  async function updateStatus() {
    if (!state.repo) {
      return
    }
    state.status = await state.repo.statusList({ includeStatus: ['materialized'] })

    // Console.log(await repo.log({ filepath: '.npmrc' }))

    let newUnpushed = 0
    const originCommits = (await state.repo.log({ ref: 'origin/' + state.currentBranch })).reduce((agg, com) => {
      agg[com.oid] = true
      return agg
    }, {})

    state.commits = (await state.repo.log()).map((com) => {
      if (originCommits[com.oid]) {
        com.origin = true
      } else {
        newUnpushed++
      }
      return com
    })

    state.unpushed = newUnpushed
  }


  return state
}

// todo: check fs/ worker/ tab/ network service / sync, sound around invalidations?
