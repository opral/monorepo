import { Link, useLocation } from '@tanstack/react-router'

const ecosystemLinks = [
  { label: 'Apps', to: '/c/apps' },
  { label: 'Plugins', to: '/c/plugins' },
  {
    label: 'Validation Rules',
    to: 'https://github.com/opral/lix-sdk/issues/239',
    external: true,
  },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80">
          <img
            src="/favicon/safari-pinned-tab.svg"
            alt="inlang"
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold text-slate-900">inlang</span>
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-700 md:flex">
          <a
            href="https://opral.substack.com/t/inlang"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900"
          >
            Blog
          </a>
          <a
            href="https://github.com/opral/inlang-sdk"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900"
          >
            SDK Documentation
          </a>
        </nav>
      </div>

      <div className="mx-auto flex max-w-7xl items-end gap-6 px-6 text-sm text-slate-600">
        <span className="border-b-2 border-transparent pb-2.5 font-medium text-slate-500">
          Ecosystem:
        </span>
        <div className="flex flex-wrap items-end gap-6">
          {ecosystemLinks.map((link) => {
            const isActive = !link.external && location.pathname === link.to

            return link.external ? (
              <a
                key={link.label}
                href={link.to}
                target="_blank"
                rel="noreferrer"
                className="border-b-2 border-transparent pb-2.5 font-medium text-slate-700 hover:text-slate-900"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className={`border-b-2 pb-2.5 font-medium transition-colors ${
                  isActive
                    ? 'border-cyan-500 text-slate-900'
                    : 'border-transparent text-slate-700 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
