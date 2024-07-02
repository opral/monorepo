<script lang="ts">
  // import { untrack } from 'svelte'
  import { openRepo, formatTime } from './lix.svelte.ts'
  import logo from './logo.png'

  // import SvelteMarkdown from 'svelte-markdown'
  // TODO: move to sveltekit, try load functions and ssr, vscode web and obsidian plugins!
  // for inlang git proxy: host + '/git/localhost:8089/janfjohannes/ci-test-repo.git',

  let repos = $state([])
  let selectdRepo = $state(0)
  let selectedRef = $state('main')

  fetch('http://gitea.localhost/api/v1/repos/search').then(async (res) => {
    const data = await res.json()
    console.log(data)
 
    repos.push(...data.data)
  })

  let metaLoaded = $state(false)

  let repo = $state(null)

  let currentCommit = $derived(repo?.commits.find(({ current }) => current) || {})

  function parseNote (noteArrayBuffer) {
    if (!noteArrayBuffer) {
      return { status: '' }
    }
    const string = new TextDecoder().decode(noteArrayBuffer)
    const parts = string.split('\n').filter(line => !!line).at(-1).split(' ')
    return {
      status: parts[0],
      job: parts[1],
      jobNr: parts[2]
    }
  }

  $effect(() => {
    if (selectdRepo !== undefined) {
      selectedRef = 'main'
      metaLoaded = false
    }
  })

  // TODO: path formatting logic + styling, text ellipsis lib, date hover + main date format lib, menu component
  // a / b / c
  //       / d
  //     v / c
  
  let opened = ''
  let userName = $state('me@opral.com')
  $effect(() => {   
    if (repos[selectdRepo] && (opened !== repos[selectdRepo]?.full_name)) {      
      opened = repos[selectdRepo]?.full_name
      
      repo = openRepo(`http://ignored.domain/direct/gitea.localhost/${repos[selectdRepo]?.full_name}`, {
        ref: selectedRef,
        author: { name: userName.split('@')[0], email: userName }
      })

      setTimeout(() => {
        metaLoaded = true
      }, 0)
      
      open('README.md')
    }
  })

  let editing = $state(true)
  let openFile = $state('')
  let file = $state({})

  function open(name) {
    openFile = name
    file = repo?.files(name)
  }

  let message = $state('')

  let uncomitted = $derived(repo?.status?.filter(([name, txt]) => txt !== 'unmodified' && !repo?.exclude?.includes(name))?.length )

  $effect(() => {
    // switch to oids/ hashes
    const lines = document.getElementById("lines")
    if (repo?.commits?.length > 1 || uncomitted) {
      const sidebar = document.getElementById('lix-sidebar').getBoundingClientRect()

      setTimeout(() => {
        lines.innerHTML = ''
        const halfDotWidth = 6
        if (uncomitted) {
          const b1 = document.getElementById(`commit-dot-new`).getBoundingClientRect()
          const b2 = document.getElementById(`commit-dot-${currentCommit.oid}`)?.getBoundingClientRect()

          const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          newLine.setAttribute('id', 'lineNew')
          newLine.setAttribute('style', 'stroke: #25B145; stroke-width: 2;')
          newLine.setAttribute('x1', b1.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y1', b1.top + halfDotWidth)
          newLine.setAttribute('x2', b1.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y2', b2.top + halfDotWidth - (Math.round(b1.left) === (b2.left) ? 0 : 15))
    
          lines.append(newLine)
          if (Math.round(b1.left) !== Math.round(b2.left)) {
            // draw rounded line to parent
            const newLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            newLine2.setAttribute('id', 'lineEndNew') 
            newLine2.setAttribute('style', 'stroke: #25B145; stroke-width: 2;')
            newLine2.setAttribute('d', `M1 0V6C1 10 5 15 10 15H23`)
            newLine2.setAttribute('transform', `translate(${b1.left - sidebar.left + halfDotWidth - 1}, ${b2.top + halfDotWidth - 15})`)

            lines.append(newLine2)
          }
        }

        for (let a = 0; a < repo.commits.length ; a++) {
          const thisCommit = repo.commits[a]
          const b1Node =  document.getElementById(`commit-dot-${thisCommit.oid}`)
          const b1 = b1Node?.getBoundingClientRect()
          let b2 = document.getElementById(`commit-dot-${thisCommit.commit.parent?.[0]}`)?.getBoundingClientRect()
          
          let color = '#DCDCDC'
          if (b1Node?.classList.contains('unpushed')) {
            color = '#25B145'
          }

          let dotted = false
          if (!b2) {
            dotted = true
            b2 = { left: b1.left, top: b1.top + 25 }
          }

          const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          newLine.setAttribute('id', 'line' + a)
          newLine.setAttribute('style', `stroke: ${color}; stroke-width: 2;` + (dotted ? 'stroke-dasharray: 3;' : ''))
          newLine.setAttribute('x1', b1.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y1', b1.top + halfDotWidth)
          newLine.setAttribute('x2', b1.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y2', b2.top + halfDotWidth - (Math.round(b1.left) === Math.round(b2.left) ? 0 : 15))

          lines.append(newLine)
    
          if (Math.round(b1.left) !== Math.round(b2.left)) {
             // draw rounded line to parent
            const newLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            newLine2.setAttribute('id', 'lineEnd' + a) 
            newLine2.setAttribute('style', `stroke: ${color}; stroke-width: 2;`)
            newLine2.setAttribute('d', `M1 0V6C1 10 5 15 10 15H23`)
            newLine2.setAttribute('transform', `translate(${b1.left - sidebar.left + halfDotWidth - 1}, ${b2.top + halfDotWidth - 15})`)

            lines.append(newLine2)
          }

          if (b1Node?.classList.contains('shallow')) {
            const newLine3 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            newLine3.setAttribute('id', 'shallowStop' + a) 
            newLine3.setAttribute('title', 'Last local commit for this branch, fetching more from reomote') 
            newLine3.setAttribute('style', `stroke: ${color}; stroke-width: 2;`)
            newLine3.setAttribute('d', `M4 12c0 -1.657 1.592 -3 3.556 -3c1.963 0 3.11 1.5 4.444 3c1.333 1.5 2.48 3 4.444 3s3.556 -1.343 3.556 -3`)

            newLine3.setAttribute('transform', `translate(${b1.left - sidebar.left - 4}, ${b2.top - 1}) scale(0.8)`)

            lines.append(newLine3)
          }
          
        }
      }, 0)
    } else {
      lines.innerHTML = ''
    }
  })

  // let timer
  // function debouncedSave() {
  //   // dirty = true
  //   if (timer === 'saving') {
  //     return
  //   }
  //   if (timer) {
  //     clearTimeout(timer)
  //   }

  //   timer = setTimeout(async () => {
  //     timer = 'saving'
  //     // await save()
  //     timer = null
  //   }, 800)
  // }

  // async function readCurrentFile(openFile) {
  //   // dirty = false
  //   setTimeout(repo.updateStatus, 10)
  // }

  function statusClasses(name, status) {
    if (name.startsWith('.git/')) {
      return 'materialized'
    }

    const fileStatus = status?.find((entry) => entry[0] === name)

    if (fileStatus) {
      let text = 'materialized'
      if (fileStatus[1] !== 'unmodified') {
        text += ' ' + 'modified'
      }
      return text
    }

    return ''
  }

  let now = $state(Date.now() / 1000)
  setInterval(() => {
    now = (Date.now() / 1000)
  }, 20000)

  const gravatarCache = new Map()
  function getGravatarURL ( email ) {
    if (gravatarCache.has(email)) {
      return gravatarCache.get(email)
    }

    const address = String( email ).trim().toLowerCase()

    const textAsBuffer = new TextEncoder().encode(address)    
    return window.crypto.subtle.digest("SHA-256", textAsBuffer).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hash = hashArray
        .map((item) => item.toString(16).padStart(2, "0"))
        .join("")

      const url = `https://www.gravatar.com/avatar/${ hash }?s=36&d=identicon`
      gravatarCache.set(email, url)
      return url
    })
  }

  async function checkout (e) {
    console.log(await repo?.checkout({ ref: e.target.value, lazy: true }))
  }
</script>

{#key repo}
  <main style="width: 100vw;">
    <!-- <header style="position: absolute; top: 10px; left: 30px;">
    </header> -->

    <div class="card">
      <aside style="position: absolute; top: 6px; left: 30px;">
        <select style="max-width: 200px; padding: 2px; margin-top: 25px;" bind:value={selectdRepo} on:mousedown={() =>{}}>
          {#each repos as repo, i}
            <option value={i}>{repo.name}</option>
          {/each}
        </select>

        <input class="commit-message" type="text" bind:value={userName} placeholder="username">
        
        <ul class="files" style="list-style: none;">
          {#each repo?.paths as path}
              <li style="cursor: pointer;" on:mousedown={() => open(path)}>
                {'📄'} &nbsp; 
                <!-- '📂' +  -->
                <span class={statusClasses(path, repo.status)}>{path}</span>
              </li>
          {/each}
        </ul>
      </aside>

      <main
        style="margin-left: 267px; position: absolute; top: 6px; whitespace: pre; max-width: 60vw; overflow-y: scroll; max-height: calc(100vh - 43px); box-sizing: border-box"
      >
        <h3 style="margin-left: 0;">{openFile}</h3>

        {#if editing}
          <p
            class="text-body"
            contenteditable="true"
            style="white-space: pre; max-width: calc(100vw - 718px); overflow: hidden; padding: 10px;"
            on:blur
            on:keydown
            bind:innerText={file.content}
          ></p>
        {:else}
          <div
            class="markdown-body"
            on:mousedown={() => {
              editing = true
            }}
          >
            <!-- <SvelteMarkdown source={content} /> -->
          </div>
        {/if}
      </main>

      <aside id="lix-sidebar">
        <img src={logo} class="logo">
        
        <svg id="lines"></svg>

        <div style="margin-bottom: 26px; margin-left: -54px;">
          <select style="max-width: 100px; padding: 2px;" on:change={checkout} bind:value={selectedRef} on:focus={repo?.listBranches} on:mouseover={repo?.listBranches}>
            {#each repo?.branches as { title, branchName, ref }}
              <option value={ref}>{title}</option>
            {/each}
          </select>

          <input type="checkbox" name="per-file" on:change={(e) => { if (e.target.checked) { repo.filepath = openFile } else { repo.filepath = undefined } }}><label for="per-file">Focus</label>
        
          <button on:mousedown={repo.pull} style="float: right; margin-left: 16px; margin-top: -10px;">
            Update
          </button>

          <button on:mousedown={() =>{ repo.clear() }} style="float: right; margin-left: 16px; margin-top: -10px;">
            Clear
          </button>


          <!-- <h3 style="display: inline-block; margin-right: 6px;">Commits</h3> -->
          {#if repo?.unpushed}
            <button on:mousedown={() => {
              repo.push()
            }} style="float: right; margin-left: 16px; margin-top: -10px;">
              Push {repo.unpushed} local commits
            </button>
          {/if}
          <!-- a) commit / submit b) publish, optional commit -->
        </div>

        {#if uncomitted}
          <div style="width: 193px;
          white-space: nowrap;
          margin-left: -2px;
          position: relative;">
            <button style="display: inline-block;" title="Commit">
              Commit
            </button>

            <button style="display: inline-block;" on:mousedown={() => {
              repo.commit(message)
              message = ''
            }} title="publish changes to {repo.refs.head.ref}">
              <div class="commit-dot current" id="commit-dot-new" style="margin-left: -134px; margin-top: 1px; background-color: #25B145;" title="You are here"></div>
              Publish
            </button>

            <button style="display: inline-block;" title="Submit for review">
              Submit
            </button>
          
            <input style="width: 100%; display: block;" class="commit-message" type="text" bind:value={message} placeholder="add description">

            <ul style="list-style: none;">
              {#each repo.status?.filter(([name, txt]) => txt !== 'unmodified' && !repo.exclude.includes(name)) || [] as entry}
                <li style="cursor: pointer;" on:mousedown={() => repo.addExclude(entry[0])} title="{entry[1]}">
                  {entry[0]}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if repo?.exclude?.length > 0}
          <h3>Exclude from next commit</h3>
          <ul style="list-style: none;">
            {#each repo.exclude || [] as entry}
              <li style="cursor: pointer;" on:mousedown={() => repo.include(entry)}>{entry}</li>
            {/each}
          </ul>
        {/if}

        <div style="width: 100%">
          {#each repo?.commits as { commit, origin, oid, current, indent, headOnly, shallow }}
            <div style="font-size: 11px;" class="commit {current && !uncomitted ? 'current': ''}" title="Id:{oid}   Hash:{commit.tree}   Parents:{JSON.stringify(commit.parent)}">
              <div class:shallow class="commit-dot {headOnly ? 'unpushed' : ''} {current && !uncomitted ? 'current': ''}" id="commit-dot-{oid}" title="{current && !uncomitted ? 'You are here' : ''}" style="margin-left: -{((indent|| 0) * 24) + 27}px;">
                {#if commit.parent.length> 1}+{/if}
              </div>

              <div class="commit-meta">
                <div class="date">{formatTime(commit.author.timestamp, now)}</div>

                {#if metaLoaded}
                  {#await repo?.readNote({ oid, ref: 'refs/notes/checks' }).catch((err) => { console.log(err); return }).then(note => parseNote(note))}
                      ?
                    {:then note}
                      {#if note.status === 'success'}
                        <svg class="" width="16" height="16" viewBox="0 0 16 16" fill="#26a544" role="img" focusable="false" aria-hidden="true" style="--icon-color: #26a544;"><path d="M14.6722 3.27047C15.0901 3.6482 15.1112 4.28103 14.7195 4.68394L6.94174 12.6839C6.74966 12.8815 6.48271 12.9955 6.2019 12.9999C5.9211 13.0042 5.65047 12.8986 5.45189 12.7071L1.30374 8.70711C0.898753 8.31659 0.898753 7.68342 1.30374 7.2929C1.70873 6.90237 2.36534 6.90237 2.77033 7.2929L6.16115 10.5626L13.2064 3.31606C13.5981 2.91315 14.2544 2.89274 14.6722 3.27047Z"></path></svg>
                      {:else if note.status === 'failure'}
                        <svg fill="red" aria-label="2 / 3 checks OK" role="img" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-x">
                          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                        </svg>
                      {:else if note.status}
                        {note.status}
                      {/if}
                  {/await}
                {/if}
                
                {#if commit.author.email !== userName}
                  {#await getGravatarURL(commit.author.email) then url}
                    <div class="avatar" style="background-image: url({url});" title="{commit.author.email}"></div>
                  {/await}
                  
                  <div style="color: rgb(124 125 126); font-size: 12px; font-weight: 500;">{commit.author.name}</div>
                {/if}
                
                {#if origin}
                  <div title={repo.refs.baseBranch.ref} class="bookmark{repo.refs.head.ref === 'refs/heads/main' ? ' mainline' : ''}">{repo.refs.baseBranch.ref.split('/').at(-1)}</div>
                {/if}

                <button class="goto" style="display: inline-block;" on:mousedown={async () => {}}>Goto</button>
              </div>
                
              {#if commit.message.length > 0}
                <p style="margin-bottom: 12px; margin-top: 5px; white-space: pre-wrap; color: white;">{commit.message.split('\n')[0]}</p>
                <!-- {commit.message.split('\n').length > 1 ? '...' : ''} -->
              {/if}
            </div>
          {/each}
        </div>

        <button style="display: block; margin-left: auto; margin-right: auto; position: relative;" on:mousedown={() => {
          repo.nextPage()
        }}>Load More</button>
      </aside>
    </div>
  </main>
{/key}

<style>
  .avatar {
    filter: opacity(0.7) saturate(0.5) contrast(1.2);
    width: 18px;
    height: 18px;
    box-shadow: inset 0 0 2px 1px black;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    margin-right: -8px;
  }
  .commit:hover .avatar {  
    filter: none;
  }
  .date {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
  }
  .commit-message {
    border-radius: 7px;
    padding: 8px;
    border: 1px solid #343434;
  }
  .commit-meta {
    height: 32px;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-content: center;
    justify-content: flex-start;
    align-items: center;
    gap: 14px;
    
  }
  button {
    cursor: pointer;
  }
  .goto {
    visibility: hidden;
  }
  .commit:hover .goto {
    visibility: visible;
  }
  #lines {
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    position: absolute;
    margin: 0;
    pointer-events: none;
  }
  button {
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 12px;
    padding: 8px 11px;
  }

  .bookmark {
    line-height: 14px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 2px;
    background: #1F6FEB;
    padding: 6px;
    padding-left: 11px;
    padding-right: 11px;
    font-weight: bold;
  }
  .mainline.bookmark {
    border: 1px solid #383838;
    background: #000;
    box-shadow: 0 0 10px 0px #272727;
  }

  #lix-sidebar {
    overflow: auto;
    right: 0;
    top: 0;
    border-top-left-radius: 30px;
    height: 100vh;
    border-bottom-left-radius: 30px;
    position: fixed;
    box-sizing: border-box;
    padding: 38px;
    padding-left: 85px;
    width: 450px;
    background: hsl(218 19% 4% / 1);
    border: 1px solid #323232;
  }

  #lix-sidebar p {
    margin: 0;
  }

  .commit-dot {
    content: ' ';
    position: absolute;
    color: #000000;
    font-weight: 800;
    text-align: center;
    line-height: 12px;
    font-size: 14px;
    width: 14px;
    height: 14px;
    border-radius: 100%;
    background-color: #DCDCDC;
    /* margin-left: -27px; */
    margin-top: 10px;
    user-select: none;
    cursor: pointer;
  }
  .commit-dot.current {
    /* background-color:  #25B145;
    box-shadow: 0 0 6px 6px #25b14633; */
    background-color: #ffffff;
    box-shadow: 0 0 0px 4px #25b146, 0 0 12px 6px #25b146bd;
  }
  .commit-dot.unpushed { 
    background-color:  #25B145;
  }
  /* .commit-dot.current:before {
    background-color: white;
    content: ' ';
    width: 7px;
    display: block;
    margin: 3px;
    height: 7px;
    border-radius: 100%;
  } */

  .text-body:focus-visible {
    outline: none;
  }
  
  .files {
    list-style: none;
    overflow: scroll;
    max-width: 264px;
    white-space: nowrap;
    max-height: calc(100vh - 79px);
  }

  .files span {
    font-weight: lighter;
  }

  .files span.materialized {
    font-weight: bold;
  }


  .files span.modified:after {
    content: 'M';
    color: orange;
    margin-left: 4px;
    font-weight: normal;
  }

  ul {
    padding: 0;
  }
  .markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 980px;
    margin: 0 auto;
  }
  :global(img) {
    max-width: 60vw;
  }
  :global(h1) {
    font-size: 2em;
  }
  :global(h3) {
    font-size: 1.5em;
    margin-left: -16px;
    margin-bottom: 6px;
  }
  .logo {
    position: absolute;
    width: 20px;
    bottom: 11px;
    right: 10px;
  }
</style>
