# Git SDK notes

This document is a collection of observations in regards to engineering and UX problems that have been made using git as SDK. Those observations will likely serve as learnings and design requirements for a version control SDK (the next git).

## Engineering

Engineering related issues that make working with git cumbersome.

### Git push automatically fails if remote has changes

#### Problem

Git push automatically fails if someone else made changes in the same branch eventhough no merge conflicts arises.

This decision forces every app that uses git to manually fetch and merge outstanding changes before a push. As discribed in GitHub's documentation ["Dealing with non-fast-forward errors"](https://docs.github.com/en/get-started/using-git/dealing-with-non-fast-forward-errors).

#### Proposal

Git push should account for merge conflicts. If no merge conflicts exist, push should not fail.

## UX

User experience (design) related issues that make git hard(er) to understand/use, especially for non-technical users.

### If real-time collaboration within a branch exists, the concept of `push` and `pull` might become redundant (for the average user).

@samuelstroschein TODO
