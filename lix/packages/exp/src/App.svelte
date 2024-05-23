<script lang="ts">
  // import { untrack } from 'svelte'
  import { openRepo } from './lix.svelte.ts'
  import logo from './logo.png'

  // import SvelteMarkdown from 'svelte-markdown'
  // TODO: move to sveltekit, try load functions and ssr, vscode web and obsidian plugins!


  const host = 'https://git.local'
  const repos = {
    gitserver: 'https://ignored.domain/direct/git.local/jan/example.git',
    test: host + '/git/localhost:8089/janfjohannes/ci-test-repo.git',
    'cal.com': 'https://ignored.domain/direct/git.local/jan/cal.com'
  }

  const selectdRepo = 'gitserver'

  const repo = openRepo(repos[selectdRepo], {
    branch: "main",
    author: { name: 'me', email: 'user@oral.com' }
  })

  let editing = $state(true)
  let openFile = $state('')
  let file = $state({})

  function open(name) {
    openFile = name
    file = repo.files(openFile)
  }
  open('README.md')

  let message = $state('')

  let uncomitted = $derived(repo?.status?.filter(([name, txt]) => txt !== 'unmodified' && !repo?.exclude?.includes(name))?.length )

  $effect(() => {
    // switch to oids/ hashes
    const lines = document.getElementById("lines")
    if (repo.commits.length > 1 || uncomitted) {
      const sidebar = document.getElementById('lix-sidebar').getBoundingClientRect()

      setTimeout(() => {
        lines.innerHTML = ''
        const halfDotWidth = 6
        if (uncomitted) {
          const b1 = document.getElementById(`commit-dot-new`).getBoundingClientRect()
          const b2 = document.getElementById(`commit-dot-0`).getBoundingClientRect()

          const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          newLine.setAttribute('id', 'line1')
          newLine.setAttribute('style', 'stroke: #25B145; stroke-width: 2;')
          newLine.setAttribute('x1', b1.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y1', b1.top + halfDotWidth)
          newLine.setAttribute('x2', b2.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y2', b2.top + halfDotWidth)
    
          lines.append(newLine)
        }

        for (let a = 0; a < repo.commits.length - 1; a++) {
          const b1 = document.getElementById(`commit-dot-${a}`).getBoundingClientRect()
          const b2 = document.getElementById(`commit-dot-${a + 1}`).getBoundingClientRect()

          const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          newLine.setAttribute('id', 'line1')
          newLine.setAttribute('style', 'stroke: #DCDCDC; stroke-width: 2;')
          newLine.setAttribute('x1', b1.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y1', b1.top + halfDotWidth)
          newLine.setAttribute('x2', b2.left - sidebar.left + halfDotWidth)
          newLine.setAttribute('y2', b2.top + halfDotWidth)
    
          lines.append(newLine)
        }
      }, 2)
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

  const rtf = new Intl.RelativeTimeFormat("en", {
    localeMatcher: "best fit", 
    numeric: "always",
    style: "narrow"
  })

  let now = $state(Date.now() / 1000)
  setInterval(() => {
    now = (Date.now() / 1000)
  }, 20000)

  function formatTime (time, now) {
    const delta = Math.abs(time - now)

    const values = [
      (delta / 31536000), // years
      (delta / 2592000) % 12, // months
      (delta / 604800) % 4, // weeks
      (delta / 86400), // days
      (delta / 3600) % 24, // hours
      (delta / 60) % 60, // minutes
      delta % 60 // seconds
    ]
    const units = ['year', 'month', 'week',' day', 'hour', 'minute', 'second']

    for (let i = 0; i < values.length; i++) {
      if (values[i] >= 1) {
        // @ts-expect-error
        return rtf.format( -values[i].toFixed(0), units[i] )
      }
    }

    return 'now'
  }
  
</script>

<main style="width: 100vw;">
  <!-- <header style="position: absolute; top: 10px; left: 30px;">

  </header> -->

  <div class="card">
    <aside style="position: absolute; top: 6px; left: 30px;">
      <h3>Folders</h3>
      
      <ul class="files" style="list-style: none;">
        {#each repo.folders as { name, type }}
          <li style="cursor: pointer;" on:click={() => open(name)}>
            {type} &nbsp;
            <span class={statusClasses(name, repo.status)}>{name}</span>
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
          on:click={() => {
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

      <div style="margin-bottom: 26px;">
        <select style="max-width: 200px; padding: 2px;" bind:value={repo.currentBranch} on:click={repo.fetchRefs}>
          {#each repo.branches as branch}
            <option value={branch}>{branch}</option>
          {/each}
        </select>

        <button on:click={repo.pull} style="float: right; margin-left: 16px; margin-top: -10px;">
          Sync
        </button>

        <!-- <h3 style="display: inline-block; margin-right: 6px;">Commits</h3> -->
        {#if repo.unpushed}
          <button on:click={repo.push} style="float: right; margin-left: 16px; margin-top: -10px;">
            Push {repo.unpushed} local commits
          </button>
        {/if}
        <!-- a) commit / submit b) publish, optional commit -->
      </div>

      {#if uncomitted}
        <div>
          <!-- <h3 style="display: inline-block; margin-right: 6px;">Next Commit</h3> -->
          <button style="display: inline-block;" on:click={() => repo.commit(message)} title="publish changes to {repo.currentBranch}">
            <div class="commit-dot current" id="commit-dot-new" style="margin-left: -39px; margin-top: 1px; background-color: #25B145;"></div>
            Publish
          </button>

          <button style="display: inline-block;" title="Submit for review">
            Submit
          </button>
        </div>
        
        <input class="commit-message" type="text" bind:value={message} placeholder="add commit message">

        <ul style="list-style: none;">
          {#each repo.status?.filter(([name, txt]) => txt !== 'unmodified' && !repo.exclude.includes(name)) || [] as entry}
            <li style="cursor: pointer;" on:click={() => repo.addExclude(entry[0])} title="{entry[1]}">
              {entry[0]}
            </li>
          {/each}
        </ul>
      {/if}

      {#if repo.exclude?.length > 0}
        <h3>Exclude from next commit</h3>
        <ul style="list-style: none;">
          {#each repo.exclude || [] as entry}
            <li style="cursor: pointer;" on:click={() => repo.include(entry)}>{entry}</li>
          {/each}
        </ul>
      {/if}

      <div style="width: 100%">
        {#each repo.commits as { commit, origin, oid, current }, i}
          <div style="font-size: 11px;" class="commit" title="Id:{oid}   Hash:{commit.tree}   Parents:{JSON.stringify(commit.parent)}">
            <div class="commit-dot {current && !uncomitted ? 'current': ''}" id="commit-dot-{i}">
              {#if commit.parent.length> 1}+{/if}
            </div>

            <div class="commit-meta">
              <div class="date">{formatTime(commit.author.timestamp, now)}</div>
              {#if commit.author.name !== 'me'}
                <div>{commit.author.name}</div>
              {/if}
              
              {#if origin}
                <div class="bookmark{(repo.currentBranch) === 'main' ? ' mainline' : ''}">{repo.currentBranch}</div>
              {/if}

              <button class="goto" style="display: inline-block;">Goto</button>
            </div>
              
            {#if commit.message.length > 0}
              <p style="margin-bottom: 12px; margin-top: 5px;">{commit.message}</p>
            {/if}
          </div>
        {/each}
      </div>

      <button style="display: block; margin-left: auto; margin-right: auto; position: relative;">Load More</button>
    </aside>
  </div>
</main>

<style>
  .date {
    color: rgba(255, 255, 255, 0.47);
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px; /* 218.182% */
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
    padding-left: 55px;
    width: 381px;
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
    margin-left: -27px;
    margin-top: 10px;
  }
  .commit-dot.current {
    background-color:  #25B145;
    box-shadow: 0 0 6px 6px #25b14633;
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
