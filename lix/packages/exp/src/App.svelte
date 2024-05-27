<script lang="ts">
  // import { untrack } from 'svelte'
  import { openRepo } from './lix.svelte.ts'

  // import SvelteMarkdown from 'svelte-markdown'
  // TODO: move to sveltekit, try load functions and ssr, vscode web and obsidian plugins!

  const host = 'https://git.local'
  const repos = {
    gitserver: 'https://ignored.domain/direct/git.local/opral/example.git',
    test: host + '/git/localhost:8089/janfjohannes/ci-test-repo.git',
    'cal.com': 'https://ignored.domain/direct/git.local/jan/cal.com'
  }
  const selectdRepo = 'cal.com'

  const repo = openRepo(repos[selectdRepo], {
    branch: "main",
    author: { name: 'janfjohannes', email: 'jan@inlang.com' }
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
    message = `Changes on ${repo.currentBranch} started ${new Date().toUTCString()}`

    // switch to oids/ hashes
    lines.innerHTML = ''
    if (repo.commits.length > 1 || uncomitted) {
      const lines = document.getElementById("lines")
      const sidebar = document.getElementById('lix-sidebar').getBoundingClientRect()

      if (uncomitted) {
        const b1 = document.getElementById(`commit-dot-new`).getBoundingClientRect()
        const b2 = document.getElementById(`commit-dot-0`).getBoundingClientRect()

        const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        newLine.setAttribute('id', 'line1')
        newLine.setAttribute('style', 'stroke: #25B145; stroke-width: 2;')
        newLine.setAttribute('x1', b1.left - sidebar.left + b1.width / 2)
        newLine.setAttribute('y1', b1.top + b1.height / 2)
        newLine.setAttribute('x2', b2.left - sidebar.left + b2.width / 2)
        newLine.setAttribute('y2', b2.top + b2.height / 2)
   
        lines.append(newLine)
      }

      for (let a = 0; a < repo.commits.length - 1; a++) {
        
        const b1 = document.getElementById(`commit-dot-${a}`).getBoundingClientRect()
        const b2 = document.getElementById(`commit-dot-${a + 1}`).getBoundingClientRect()

        const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        newLine.setAttribute('id', 'line1')
        newLine.setAttribute('style', 'stroke: #DCDCDC; stroke-width: 2;')
        newLine.setAttribute('x1', b1.left - sidebar.left + b1.width / 2)
        newLine.setAttribute('y1', b1.top + b1.height / 2)
        newLine.setAttribute('x2', b2.left - sidebar.left + b2.width / 2)
        newLine.setAttribute('y2', b2.top + b2.height / 2)
   
        lines.append(newLine)
      }
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
      <svg id="lines"></svg>

      <div style="margin-bottom: 26px;">
        <select style="max-width: 200px; padding: 2px;" bind:value={repo.currentBranch} on:click={repo.fetchRefs}>
          {#each repo.branches as branch}
            <option value={branch}>{branch}</option>
          {/each}
        </select>

        <button on:click={repo.pull} style="float: right; margin-left: 16px; margin-top: -10px;">Refresh</button>

        <!-- <h3 style="display: inline-block; margin-right: 6px;">Commits</h3> -->
        {#if repo.unpushed}
          <button on:click={repo.push} style="float: right; margin-left: 16px; margin-top: -10px;"
            >Push {repo.unpushed} unsaved commits</button
          >
        {/if}
        <!-- a) commit / submit b) publish, optional commit -->
      </div>

      {#if uncomitted}
        <div>
          <!-- <h3 style="display: inline-block; margin-right: 6px;">Next Commit</h3> -->
          <button style="display: inline-block;" on:click={() => repo.commit(message)}
            >
            <div class="commit-dot" id="commit-dot-new" style="margin-left: -42px; background-color: #25B145;"></div>
            Commit and Push {uncomitted} changed files</button
          >
        </div>
        <textarea rows="3" value={message}></textarea>

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

      {#each repo.commits as { commit, origin, oid }, i}
        <div style="font-size: 11px; margin-bottom: 33px;" class="commit" title="Id:{oid}   Hash:{commit.tree}   Parents:{JSON.stringify(commit.parent)}">
          <div class="commit-dot" id="commit-dot-{i}"></div>
          <p>{#if origin}<span class="bookmark">origin</span>{/if} {new Date(commit.author.timestamp * 1000).toUTCString()}</p>
          <p>{commit.author.name}</p>
          <p>{commit.message}</p>
        </div>
      {/each}

      <button style="display: inline-block;">Load More</button>
    </aside>
  </div>
</main>

<style>
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
    width: 26px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 2px;
    background: #1F6FEB;
    padding: 6px;
    margin-right: 4px;
    font-weight: bold;
  }

  #lix-sidebar {
    overflow: auto;
    right: 0;
    top: 0;
    border-top-left-radius: 30px;
    height: 100vh;
    border-bottom-left-radius: 30px;
    position: fixed;
    max-width: 337px;
    box-sizing: border-box;
    padding: 38px;
    background: hsl(218 19% 4% / 1);
  }

  #lix-sidebar p {
    margin: 0;
  }

  .commit-dot {
    content: ' ';
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 100%;
    background-color: #DCDCDC;
    margin-left: -27px;
    margin-top: 2px;
  }

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
</style>
