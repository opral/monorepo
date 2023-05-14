// @ts-nocheck
/* eslint-env node, browser, jasmine */
import { describe, it, expect, beforeAll } from 'vitest'
import { makeFixture } from './makeFixture.js'
import { listBranches } from 'isomorphic-git'


describe('listBranches', () => {
  it('listBranches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    const commits = await listBranches({ fs, gitdir })
    expect(commits).toMatchInlineSnapshot(`
      [
        "feature/supercool",
        "greenkeeper/initial",
        "master",
        "test-branch",
      ]
    `)
  })
  it('remote', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    const commits = await listBranches({
      fs,
      gitdir,
      remote: 'origin',
    })
    expect(commits).toMatchInlineSnapshot(`
      [
        "HEAD",
        "master",
      ]
    `)
  })
})
