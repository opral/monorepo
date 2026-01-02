import { useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80">
          <img
            src="/favicon/safari-pinned-tab.svg"
            alt="inlang"
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold text-slate-900">inlang</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-700 sm:flex">
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

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 sm:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 sm:hidden">
          <nav className="flex flex-col">
            <a
              href="https://opral.substack.com/t/inlang"
              target="_blank"
              rel="noreferrer"
              className="py-3 text-sm font-medium text-slate-700 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </a>
            <a
              href="https://github.com/opral/inlang-sdk"
              target="_blank"
              rel="noreferrer"
              className="py-3 text-sm font-medium text-slate-700 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              SDK Documentation
            </a>

            <span className="pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ecosystem
            </span>
            {ecosystemLinks.map((link) => {
              const isActive = !link.external && location.pathname === link.to

              return link.external ? (
                <a
                  key={link.label}
                  href={link.to}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`py-2.5 text-sm font-medium ${
                    isActive ? 'text-cyan-600' : 'text-slate-700 hover:text-slate-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Desktop: Underline-style tabs */}
      <div className="mx-auto hidden max-w-7xl items-end gap-6 px-6 text-sm text-slate-600 sm:flex">
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
