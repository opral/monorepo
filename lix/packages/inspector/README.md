# Lix Inspector 

Dev tool to analyze and debug Lix'es. 

## Features

- View the database schema
- View the database content
- View the database history
- View the database changes
- View the database snapshots

## Usage

```ts
import { initLixInspector } from "@lix-js/inspector";

// optionally only add in development
if (import.meta.env.DEV){
  // pass the lix to the inspector 
  initLixInspector({ lix });
}

```