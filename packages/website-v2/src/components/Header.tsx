import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'

const ecosystemLinks = [
  { 
    label: 'Apps', 
    to: '/c/apps',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
        <path d="M12 22V12"/>
      </svg>
    )
  },
  { 
    label: 'Plugins', 
    to: '/c/plugins',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="7" x="14" y="3" rx="1"/>
        <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>
      </svg>
    )
  },
  {
    label: 'Validation Rules',
    to: 'https://github.com/opral/lix-sdk/issues/239',
    external: true,
    icon: (
      <span className="text-sm" style={{ textDecoration: 'underline', textDecorationStyle: 'wavy', textUnderlineOffset: '2px' }}>
        Aa
      </span>
    )
  },
]

export default function Header() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top header: Site-level navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          {/* Left side: Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <img
              src="/favicon/safari-pinned-tab.svg"
              alt="inlang"
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-slate-900">inlang</span>
          </Link>

          {/* Right side: Blog + Documentation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
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
              Documentation
            </a>
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 sm:hidden"
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
      </div>

      {/* Subheader: Ecosystem categories */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto hidden max-w-7xl items-center gap-1 px-4 py-2 sm:flex sm:px-6">
          <span className="mr-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ecosystem
          </span>
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
            {ecosystemLinks.map((link) => {
              const isCurrentCategory = !link.external && location.pathname === link.to

              return link.external ? (
                <a
                  key={link.label}
                  href={link.to}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-slate-900"
                >
                  {link.icon}
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`flex items-center gap-1.5 transition-colors ${
                    isCurrentCategory
                      ? 'text-cyan-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 pb-4 sm:hidden">
          <nav className="flex flex-col">
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
                  className="flex items-center gap-1.5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`flex items-center gap-1.5 py-2.5 text-sm font-medium ${
                    isActive ? 'text-cyan-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              )
            })}

            <div className="my-2 h-px bg-slate-200" />

            <a
              href="https://opral.substack.com/t/inlang"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </a>
            <a
              href="https://github.com/opral/inlang-sdk"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
