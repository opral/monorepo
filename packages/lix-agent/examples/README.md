# Lix Agent Browser Examples

This directory contains examples for using the Lix Agent in browser environments.

## Examples

### 1. Vanilla JS Example

Files:
- `browser-demo.html` - HTML interface for the demo
- `browser-usage.js` - JavaScript implementation using the Lix Agent

### 2. React Example

Files:
- `react-example.jsx` - React component for the Lix Agent chat interface
- `react-demo.jsx` - React entry point for mounting the component
- `styles.css` - Styles for the React application

## How to Use

### Vanilla JS Example
Open `browser-demo.html` in a browser, enter your API key, select a provider, and start interacting with the agent.

### React Example
1. Import the `LixAgentChat` component from `react-example.jsx` in your React application
2. Add the component to your render tree
3. Import the styles from `styles.css` or use your own styling

Example:
```jsx
import React from 'react';
import { LixAgentChat } from './path/to/react-example';
import './path/to/styles.css';

function App() {
  return (
    <div className="app">
      <LixAgentChat />
    </div>
  );
}

export default App;
```

## Prerequisites

- For React example: React and ReactDOM libraries
- Lix Agent package (@lix-js/agent)
- Lix SDK package (@lix-js/sdk)
- OpenAI or Anthropic API key