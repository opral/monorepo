export function App(args: { children: string }): string {
	return `
    <div style="display: flex; gap: 1rem;">
      <a href="/" onclick="window.location.href='/'">All builds</a>
      <a href="/${process.env.BASE}">Home</a>
      <a href="/${process.env.BASE}/about">About</a>
    </div>

    <div>
      ${args.children}
    </div>
  `;
}
