import { useState } from "react";
import type { SyntheticEvent } from "react";

const prosemirrorScreenshot = new URL(
  "../../../plugin-prosemirror/assets/prosemirror.png",
  import.meta.url,
).href;

/**
 * Copy icon used for the install command interaction.
 *
 * @example
 * <CopyIcon />
 */
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

/**
 * Check icon shown after the install command is copied.
 *
 * @example
 * <CheckIcon />
 */
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Hand-drawn style illustration representing chat-like edits.
 *
 * @example
 * <CursorEditingIllustration />
 */
const CursorEditingIllustration = () => (
  <div
    className="inline-flex w-full max-w-[240px] flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
    aria-hidden="true"
  >
    <div className="h-3 w-full rounded bg-gray-200" />
    <div className="h-3 w-3/4 rounded bg-rose-200" />
    <div className="h-3 w-4/5 rounded bg-emerald-200" />
    <div className="h-3 w-1/2 rounded bg-gray-200" />
  </div>
);

/**
 * Illustration highlighting async branching workflows.
 *
 * @example
 * <AsyncWorkflowIllustration />
 */
const AsyncWorkflowIllustration = () => (
  <div
    className="inline-flex w-full max-w-[240px] flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 187.75157590091476 120.55659158611115"
      className="h-32 w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <symbol id="async-agent-avatar">
          <image
            href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdpdC1tZXJnZS1pY29uIGx1Y2lkZS1naXQtbWVyZ2UiPjxjaXJjbGUgY3g9IjE4IiBjeT0iMTgiIHI9IjMiLz48Y2lyY2xlIGN4PSI2IiBjeT0iNiIgcj0iMyIvPjxwYXRoIGQ9Ik02IDIxVjlhOSA5IDAgMCAwIDkgOSIvPjwvc3ZnPg=="
            preserveAspectRatio="none"
            width="100%"
            height="100%"
          />
        </symbol>
        <symbol id="async-agent-checkpoint">
          <image
            href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDBwdCIgaGVpZ2h0PSIxMDBwdCIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiA8Zz4KICA8cGF0aCBkPSJtNjAuMTI1IDc4Ljg4N2g2LjQyNTh2Ni45MDYyaC02LjQyNTh6Ii8+CiAgPHBhdGggZD0ibTM1LjU2MiA1NS43NWMzLjkxMDIgMCA3LjQzMzYtMi4zNTU1IDguOTI5Ny01Ljk2ODggMS40OTYxLTMuNjA5NCAwLjY3MTg3LTcuNzY5NS0yLjA5MzgtMTAuNTM1LTIuNzY1Ni0yLjc2MTctNi45MjE5LTMuNTg5OC0xMC41MzUtMi4wOTM4cy01Ljk2ODggNS4wMTk1LTUuOTY4OCA4LjkyOTdjMC4wMTE3MTkgNS4zMzU5IDQuMzMyIDkuNjU2MiA5LjY2OCA5LjY2OHoiLz4KICA8cGF0aCBkPSJtNTEuNjEzIDc4Ljg4N2g2LjQyNTh2Ni45MDYyaC02LjQyNTh6Ii8+CiAgPHBhdGggZD0ibTM0LjYwNSA3OC44ODdoNi40MjU4djYuOTA2MmgtNi40MjU4eiIvPgogIDxwYXRoIGQ9Im00My4xMTMgNzguODg3aDYuMzI0MnY2LjkwNjJoLTYuMzI0MnoiLz4KICA8cGF0aCBkPSJtMjUuODQ0IDc4Ljg4N2g2LjY4NzV2Ni45MDYyaC02LjY4NzV6Ii8+CiAgPHBhdGggZD0ibTY1LjQzOCAzNi40NTdjLTMuOTEwMiAwLjAxOTUzMS03LjQyNTggMi4zODY3LTguOTA2MiA2LjAwNzgtMS40ODA1IDMuNjE3Mi0wLjYzMjgxIDcuNzczNCAyLjE0MDYgMTAuNTIzIDIuNzc3MyAyLjc1MzkgNi45Mzc1IDMuNTYyNSAxMC41NDcgMi4wNTA4IDMuNjA1NS0xLjUxMTcgNS45NDUzLTUuMDQ2OSA1LjkyNTgtOC45NTctMC4wMjczNDMtNS4zMzU5LTQuMzcxMS05LjY0MDYtOS43MDctOS42MjV6Ii8+CiAgPHBhdGggZD0ibTczLjM1NSAyMS4wMmgtNDYuNzExYy02LjUwMzkgMC4wMDc4MTMtMTEuNzczIDUuMjc3My0xMS43ODEgMTEuNzgxdjU1LjQxOGMwLjAwNzgxMyA2LjUwMzkgNS4yNzczIDExLjc3NyAxMS43ODEgMTEuNzgxaDQ2LjcxMWM2LjUwMzktMC4wMDM5MDYgMTEuNzc3LTUuMjczNCAxMS43ODktMTEuNzgxdi01NS40MThjLTAuMDExNzE5LTYuNTAzOS01LjI4NTItMTEuNzczLTExLjc4OS0xMS43ODF6bS0yMi45MTggMzguNDU3djAuMDAzOTA3YzAuMzI4MTIgMCAwLjY0MDYyIDAuMTYwMTYgMC44MzIwMyAwLjQyNTc4bDYuODg2NyA5LjM3NWMwLjIxMDk0IDAuMzA4NTkgMC4yNDYwOSAwLjcwMzEyIDAuMDgyMDMxIDEuMDQzLTAuMTc5NjkgMC4zNDM3NS0wLjUzNTE2IDAuNTYyNS0wLjkyNTc4IDAuNTYyNWgtMTMuNzE5Yy0wLjM5MDYyIDAtMC43NDYwOS0wLjIxODc1LTAuOTI1NzgtMC41NjI1LTAuMTYwMTYtMC4zMzk4NC0wLjEyNS0wLjczODI4IDAuMDkzNzUtMS4wNDNsNi44NzUtOS4zNzVjMC4xOTUzMS0wLjI2OTUzIDAuNTA3ODEtMC40Mjk2OSAwLjg0Mzc1LTAuNDI1Nzh6bS0xNC44NzUtMjUuMTAyYzQuNzUgMC4wMTk1MzEgOS4wMjM0IDIuOTAyMyAxMC44MjQgNy4zMDA4IDEuNzk2OSA0LjM5NDUgMC43NzM0NCA5LjQ0NTMtMi42MDE2IDEyLjc4OS0zLjM3MTEgMy4zNDc3LTguNDI5NyA0LjMzMi0xMi44MTIgMi41LTQuMzgyOC0xLjgzNTktNy4yMzA1LTYuMTI4OS03LjIxMDktMTAuODgzIDAuMDMxMjUtNi40ODgzIDUuMzEyNS0xMS43MjMgMTEuODAxLTExLjcwN3ptNDEuNjY4IDUyLjQ0OWMwIDAuMjczNDQtMC4xMDkzOCAwLjUzOTA2LTAuMzA0NjkgMC43MzQzOC0wLjE5NTMxIDAuMTk1MzEtMC40NjA5NCAwLjMwNDY5LTAuNzM4MjggMC4zMDQ2OWgtNTEuMzg3Yy0wLjU3NDIyIDAtMS4wMzkxLTAuNDY0ODQtMS4wMzkxLTEuMDM5MXYtOC45ODA1YzAtMC41NzQyMiAwLjQ2NDg0LTEuMDQzIDEuMDM5MS0xLjA0M2g1MS4zODdjMC4yNzczNCAwIDAuNTQyOTcgMC4xMDkzOCAwLjczODI4IDAuMzA0NjkgMC4xOTUzMSAwLjE5NTMxIDAuMzA0NjkgMC40NjA5NCAwLjMwNDY5IDAuNzM4Mjh6bS0xMS43OTMtMjguOTkyYy00Ljc1LTAuMDE1NjI1LTkuMDE5NS0yLjg5MDYtMTAuODI0LTcuMjgxMi0xLjgwODYtNC4zOTA2LTAuNzkyOTctOS40Mzc1IDIuNTcwMy0xMi43ODkgMy4zNjcyLTMuMzUxNiA4LjQxOC00LjM1MTYgMTIuODAxLTIuNTMxMiA0LjM4NjcgMS44MjQyIDcuMjQ2MSA2LjEwNTUgNy4yNDYxIDEwLjg1Mi0wLjAwMzkwNyAzLjEyNS0xLjI1IDYuMTE3Mi0zLjQ2MDkgOC4zMjAzLTIuMjEwOSAyLjIwNy01LjIxMDkgMy40Mzc1LTguMzMyIDMuNDI5N3oiLz4KICA8cGF0aCBkPSJtNTAuNDggNjIuMjgxLTQuODM1OSA2LjYwNTVoOS42NTYyeiIvPgogIDxwYXRoIGQ9Im02OC42MjUgNzguODg3aDYuNDgwNXY2LjkwNjJoLTYuNDgwNXoiLz4KICA8cGF0aCBkPSJtOTEuOTQ5IDQ1LjIzOGMtMC41NzgxMiAwLTEuMDQzLTAuNDY0ODQtMS4wNDMtMS4wMzkxdi0zMy43ODFjMC0wLjU3ODEyIDAuNDY0ODQtMS4wNDMgMS4wNDMtMS4wNDMgMC41NzQyMiAwIDEuMDM5MSAwLjQ2NDg0IDEuMDM5MSAxLjA0M3YzMy43ODFjMCAwLjI3MzQ0LTAuMTA5MzggMC41MzkwNi0wLjMwNDY5IDAuNzM0MzgtMC4xOTUzMSAwLjE5NTMxLTAuNDYwOTQgMC4zMDQ2OS0wLjczNDM4IDAuMzA0Njl6Ii8+CiAgPHBhdGggZD0ibTk4LjgxMiA0OC44NDR2MTUuOTA2Yy0wLjAwMzkwNiAzLjE0MDYtMi41NDY5IDUuNjgzNi01LjY4NzUgNS42ODc1aC01Ljg5NDV2LTI3LjI4MWg1Ljg5NDVjMy4xNDA2IDAuMDAzOTA2IDUuNjgzNiAyLjU0NjkgNS42ODc1IDUuNjg3NXoiLz4KICA8cGF0aCBkPSJtMTIuNzgxIDQzLjE1NnYyNy4yODFoLTUuOTA2MmMtMy4xNDA2LTAuMDAzOTA2LTUuNjgzNi0yLjU0NjktNS42ODc1LTUuNjg3NXYtMTUuOTA2YzAuMDAzOTA2LTMuMTQwNiAyLjU0NjktNS42ODM2IDUuNjg3NS01LjY4NzV6Ii8+CiAgPHBhdGggZD0ibTguMDUwOCA0NS4yMzhjLTAuNTc0MjIgMC0xLjAzOTEtMC40NjQ4NC0xLjAzOTEtMS4wMzkxdi0zMy43ODFjMC0wLjU3ODEyIDAuNDY0ODQtMS4wNDMgMS4wMzkxLTEuMDQzIDAuNTc4MTIgMCAxLjA0MyAwLjQ2NDg0IDEuMDQzIDEuMDQzdjMzLjc4MWMwIDAuMjczNDQtMC4xMDkzOCAwLjUzOTA2LTAuMzA0NjkgMC43MzQzOC0wLjE5NTMxIDAuMTk1MzEtMC40NjA5NCAwLjMwNDY5LTAuNzM4MjggMC4zMDQ2OXoiLz4KICA8cGF0aCBkPSJtOTcuNjU2IDUuNzA3YzAgMi4zMDg2LTEuMzkwNiA0LjM5MDYtMy41MjM0IDUuMjczNC0yLjEzMjggMC44ODY3Mi00LjU4OTggMC4zOTg0NC02LjIyMjctMS4yMzQ0LTEuNjMyOC0xLjYzMjgtMi4xMjExLTQuMDg5OC0xLjIzNDQtNi4yMjI3IDAuODgyODEtMi4xMzI4IDIuOTY0OC0zLjUyMzQgNS4yNzM0LTMuNTIzNCAxLjUxMTcgMCAyLjk2NDggMC42MDE1NiA0LjAzNTIgMS42NzE5czEuNjcxOSAyLjUyMzQgMS42NzE5IDQuMDM1MnoiLz4KICA8cGF0aCBkPSJtMTMuNzYyIDUuNzA3YzAgMy4xNTIzLTIuNTU4NiA1LjcxMDktNS43MTA5IDUuNzEwOS0zLjE1MjMgMC01LjcwNy0yLjU1ODYtNS43MDctNS43MTA5IDAtMy4xNTIzIDIuNTU0Ny01LjcwNyA1LjcwNy01LjcwNyAzLjE1MjMgMCA1LjcxMDkgMi41NTQ3IDUuNzEwOSA1LjcwNyIvPgogPC9nPgo8L3N2Zz4="
            preserveAspectRatio="none"
            width="100%"
            height="100%"
          />
        </symbol>
        <style>{`@font-face { font-family: "Comic Shanns"; src: url(data:font/woff2;base64,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); }`}</style>
      </defs>
      <rect
        x="0"
        y="0"
        width="187.75157590091476"
        height="120.55659158611115"
        fill="#ffffff"
      />
      <g strokeLinecap="round">
        <g transform="translate(18.34830013564715 14.545933930658293) rotate(0 0.1316811308506658 48.00532882772643)">
          <path
            d="M0 0 C-0.83 28.87, -2.39 55.66, 0.26 96.01 M0 0 C0.15 31.79, -0.12 65.62, 0.26 96.01"
            stroke="#000000"
            strokeWidth="2"
            fill="none"
          />
        </g>
      </g>
      <g transform="translate(43.890187172653896 10.597529379081152) rotate(0 23.693984985351562 8.97739723540667)">
        <text
          x="0"
          y="12.56835612956935"
          fontFamily='"Comic Shanns", sans-serif'
          fontSize="14.363835576650688"
          fill="#1e1e1e"
        >
          merged
        </text>
      </g>
      <g transform="translate(56.89972778644915 46.25743279979929) rotate(0 10.294483472688626 10.29448347268817)">
        <use
          href="#async-agent-checkpoint"
          width="21"
          height="21"
          opacity="1"
        />
      </g>
      <g transform="translate(82.97563595950851 48.86803881109404) rotate(0 47.387969970703125 8.97739723540667)">
        <text
          x="0"
          y="12.56835612956935"
          fontFamily='"Comic Shanns", sans-serif'
          fontSize="14.363835576650688"
          fill="#1e1e1e"
        >
          fix spelling
        </text>
      </g>
      <g transform="translate(41.825091552154845 85.40411087068264) rotate(0 47.387969970703125 8.97739723540667)">
        <text
          x="0"
          y="12.56835612956935"
          fontFamily='"Comic Shanns", sans-serif'
          fontSize="14.363835576650688"
          fill="#1e1e1e"
        >
          add document
        </text>
      </g>
      <g strokeLinecap="round">
        <g transform="translate(20.029223717050627 91.05546746840923) rotate(0 11.894338706990311 -23.783246077665353)">
          <path
            d="M0 0 C3.87 -2.91, 19.27 -9.55, 23.23 -17.48 C27.2 -25.4, 23.7 -42.55, 23.79 -47.57 M0 0 C3.87 -2.91, 19.27 -9.55, 23.23 -17.48 C27.2 -25.4, 23.7 -42.55, 23.79 -47.57"
            stroke="#1e1e1e"
            strokeWidth="2"
            fill="none"
          />
        </g>
        <g transform="translate(42.75487941351457 42.50495784611758) rotate(0 -11.121422410754349 -9.447668749566219)">
          <path
            d="M0 0 C-6.53 -5.55, -13.06 -11.09, -22.24 -18.9 M0 0 C-6.44 -5.47, -12.89 -10.95, -22.24 -18.9"
            stroke="#1e1e1e"
            strokeWidth="2"
            fill="none"
          />
        </g>
      </g>
      <g transform="translate(10 10) rotate(0 10.54745795938743 10.54745795938743)">
        <path
          d="M21.09 10.55 C21.09 11.16, 21.04 11.78, 20.93 12.38 C20.83 12.98, 20.67 13.58, 20.46 14.15 C20.25 14.73, 19.99 15.29, 19.68 15.82 C19.38 16.35, 19.02 16.86, 18.63 17.33 C18.23 17.79, 17.79 18.23, 17.33 18.63 C16.86 19.02, 16.35 19.38, 15.82 19.68 C15.29 19.99, 14.73 20.25, 14.15 20.46 C13.58 20.67, 12.98 20.83, 12.38 20.93 C11.78 21.04, 11.16 21.09, 10.55 21.09 C9.94 21.09, 9.32 21.04, 8.72 20.93 C8.11 20.83, 7.51 20.67, 6.94 20.46 C6.37 20.25, 5.8 19.99, 5.27 19.68 C4.75 19.38, 4.24 19.02, 3.77 18.63 C3.3 18.23, 2.86 17.79, 2.47 17.33 C2.08 16.86, 1.72 16.35, 1.41 15.82 C1.11 15.29, 0.84 14.73, 0.64 14.15 C0.43 13.58, 0.27 12.98, 0.16 12.38 C0.05 11.78, 0 11.16, 0 10.55 C0 9.94, 0.05 9.32, 0.16 8.72 C0.27 8.11, 0.43 7.51, 0.64 6.94 C0.84 6.37, 1.11 5.8, 1.41 5.27 C1.72 4.75, 2.08 4.24, 2.47 3.77 C2.86 3.3, 3.3 2.86, 3.77 2.47 C4.24 2.08, 4.75 1.72, 5.27 1.41 C5.8 1.11, 6.37 0.84, 6.94 0.64 C7.51 0.43, 8.11 0.27, 8.72 0.16 C9.32 0.05, 9.94 0, 10.55 0 C11.16 0, 11.78 0.05, 12.38 0.16 C12.98 0.27, 13.58 0.43, 14.15 0.64 C14.73 0.84, 15.29 1.11, 15.82 1.41 C16.35 1.72, 16.86 2.08, 17.33 2.47 C17.79 2.86, 18.23 3.3, 18.63 3.77 C19.02 4.24, 19.38 4.75, 19.68 5.27 C19.99 5.8, 20.25 6.37, 20.46 6.94 C20.67 7.51, 20.83 8.11, 20.93 8.72 C21.04 9.32, 21.07 10.24, 21.09 10.55 C21.12 10.85, 21.12 10.24, 21.09 10.55"
          fill="#d0bfff"
        />
        <g transform="translate(3.785536291607059 2.192950567596654)">
          <use href="#async-agent-avatar" width="15" height="15" opacity="1" />
        </g>
      </g>
    </svg>
  </div>
);

/**
 * Illustration showing audit and approval checklists.
 *
 * @example
 * <AuditWorkflowIllustration />
 */
const AuditWorkflowIllustration = () => (
  <div
    className="inline-flex w-full max-w-[240px] flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4"
    aria-hidden="true"
  >
    <button className="relative flex items-center justify-center rounded border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
      <span className="absolute left-4 flex h-4 w-4 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 10l3 3 7-7" />
        </svg>
      </span>
      Approve
    </button>
    <button className="relative flex items-center justify-center rounded border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
      <span className="absolute left-4 flex h-4 w-4 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 6l8 8M14 6l-8 8" />
        </svg>
      </span>
      Request changes
    </button>
  </div>
);

/**
 * Lix logo used across the landing page.
 *
 * @example
 * <LixLogo className="h-6 w-6" />
 */
const LixLogo = ({ className = "" }) => (
  <svg
    width="30"
    height="22"
    viewBox="0 0 26 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g id="Group 162">
      <path
        id="Vector"
        d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
        fill="#2563EB"
      />
      <path
        id="Vector_2"
        d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
        fill="#2563EB"
      />
      <path
        id="Vector_3"
        d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
        fill="#2563EB"
      />
      <path
        id="Rectangle 391"
        d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
        fill="#2563EB"
      />
    </g>
  </svg>
);

/**
 * Renders the CLI install command with copy interaction.
 *
 * @example
 * <PackageInstaller />
 */
const PackageInstaller = () => {
  const [copied, setCopied] = useState(false);

  const copyFullCommand = () => {
    const command = "npm i @lix-js/sdk";
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex h-11 items-center justify-center gap-3 px-5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 transition-colors duration-200 hover:bg-gray-50">
      <span className="font-mono text-sm leading-none cursor-text select-all">
        npm i @lix-js/sdk
      </span>
      <button
        onClick={copyFullCommand}
        className="h-6 w-6 transition-colors duration-200 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        title="Copy full command"
        aria-label={copied ? "Command copied" : "Copy install command"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
};

/**
 * Landing page for the Lix documentation site.
 *
 * @example
 * <LandingPage />
 */
function LandingPage() {
  const buildShowcases = [
    {
      id: "flashtype",
      title: "Flashtype – AI Markdown Editor",
      category: "AI content",
      description:
        "Generate documents with AI, capture history for every prompt, and ship safe revisions.",
      screenshot: "/flashtype.png",
      fallback: "Flashtype Demo",
      href: "https://flashtype.ai",
      ctaLabel: "Explore Flashtype →",
      creator: "Flashtype",
      creatorRole: "Public app",
      creatorInitials: "FT",
    },
    {
      id: "inlang",
      title: "Inlang – Software globalization ecosystem",
      category: "Localization platform",
      description:
        "Create, localize, and deliver product experiences with AI-assisted translation, review workflows, and Lix change control.",
      screenshot: "/inlang.png",
      fallback: "Inlang Preview",
      href: "https://inlang.com",
      ctaLabel: "Explore Inlang →",
      creator: "Inlang",
      creatorRole: "Product ecosystem",
      creatorInitials: "IL",
    },
    {
      id: "prosemirror",
      title: "ProseMirror / TipTap Plugin",
      category: "Real-time editors",
      description:
        "Collaborative publishing UI with branching proposals, inline reviews, and one-click merges.",
      screenshot: prosemirrorScreenshot,
      fallback: "ProseMirror Demo",
      href: "https://github.com/opral/monorepo/tree/main/packages/lix/plugin-prosemirror",
      ctaLabel: "View code →",
      creator: "Studio Alva",
      creatorRole: "Product studio",
      creatorInitials: "SA",
    },
  ];

  const howItWorksSteps = [
    {
      number: "1",
      title: "Create a lix with the plugins",
      description:
        "Lix becomes file format-aware via plugins (`.json`, `.xlsx`, etc.). Otherwise, everything is just a blob.",
      offsetClass: "",
    },
    {
      number: "2",
      title: "Write a file into the lix",
      description:
        "Lix is powered by SQL under the hood. Writing a file, querying diffs, etc. happens all via SQL.",
      offsetClass: "mt-10 sm:mt-12",
    },
    {
      number: "3",
      title: "Query changes, diffs, etc.",
      description:
        "Query working diffs, history, propose changes or merge similar to git, right in the browser.",
      offsetClass: "mt-10 sm:mt-12",
    },
  ];

  const featureSpotlights = [
    {
      id: "review-everything",
      title: "Every AI change is reviewable",
      description:
        "Lix records who or what changed every line. Diff AI output, attribute edits to specific agents, and merge only what passes human or automated review through change proposals.",
      Illustration: CursorEditingIllustration,
    },
    {
      id: "human-approval",
      title: "Users stay in control",
      description:
        "Agents can draft changes, but humans choose what ships. Review conversations, request edits, and merge when the change proposal is ready.",
      Illustration: AuditWorkflowIllustration,
    },
    {
      id: "async-workflows",
      title: "Safe sandboxes for agents",
      description:
        "Give every agent its own version to experiment in. Compare their diffs, merge the winner, or restore a previous state instantly if the plan changes.",
      Illustration: AsyncWorkflowIllustration,
    },
  ];

  const createImageErrorHandler =
    (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
      const container = event.currentTarget.parentElement;
      if (!container) {
        return;
      }

      container.style.backgroundColor = "#0f172a";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.innerHTML = `<div style="color: #cbd5f5; font-size: 14px; font-weight: 500;">${fallback}</div>`;
    };

  return (
    <div className="font-sans text-gray-900 bg-gradient-to-b from-gray-50 to-white">
      {/* Main content */}
      <main className="relative px-4 sm:px-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-16 px-4 sm:px-6">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <h1 className="text-gray-900 font-bold leading-tight text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-8">
              Change control SDK for
              <br />
              apps and <span style={{ color: "#0692B6" }}>AI agents</span>
            </h1>

            <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mt-12">
              Lix is a JavaScript SDK that enables Git-like capabilities for
              apps and agents:
              <br />
              Change proposals, versions (branches), history, blame, etc.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16  mt-8">
              <a
                href="/guide/getting-started.html"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: "#0692B6", color: "#ffffff" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "#047497";
                  event.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "#0692B6";
                  event.currentTarget.style.color = "#ffffff";
                }}
              >
                Getting started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
              <PackageInstaller />
              <a
                href="https://prosemirror-example.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 border border-gray-300 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
              >
                Try an example app
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              <a
                href="https://www.npmjs.com/package/@lix-js/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2.5 py-6 px-5 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
              >
                <svg
                  className="w-8 h-8 text-red-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0v24h24V0H0zm19.2 19.2h-2.4V9.6h-4.8v9.6H4.8V4.8h14.4v14.4z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  npm
                </span>
                <span className="font-semibold text-sm text-gray-900">
                  60k+ weekly downloads
                </span>
              </a>

              <a
                href="https://github.com/opral/monorepo/graphs/contributors"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2.5 py-6 px-5 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
              >
                <svg
                  className="w-8 h-8 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.645.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  GitHub
                </span>
                <span className="font-semibold text-sm text-gray-900">
                  100+ contributors
                </span>
              </a>

              <a
                href="https://github.com/opral/monorepo/blob/main/packages/lix/sdk/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2.5 py-6 px-5 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
              >
                <svg
                  className="w-8 h-8 text-gray-700"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.95-7 10.18-3.87-1.23-7-5.51-7-10.18V6.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  License
                </span>
                <span className="font-semibold text-sm text-gray-900">
                  MIT Open Source
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* What You Can Build Section */}
        <section className="pt-10 pb-16 px-6 sm:px-12 md:px-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="flex flex-wrap items-center justify-center gap-2 text-center text-2xl sm:text-3xl font-bold text-gray-900">
              <span>What people build with</span>
              <span className="text-[#0692B6]">lix</span>
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-3">
              {buildShowcases.map(
                ({ id, title, screenshot, fallback, href, ctaLabel }) => (
                  <a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 transition-transform duration-300 hover:-translate-y-2 hover:border-gray-300"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={screenshot}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        onError={createImageErrorHandler(fallback)}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-4 text-gray-900">
                      <h3 className="text-sm font-semibold sm:text-base md:text-lg">
                        {title}
                      </h3>
                      <span className="relative inline-flex items-center text-sm font-medium text-blue-600">
                        <span className="sr-only">{ctaLabel}</span>
                        <span className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:text-blue-700">
                          Open
                          <span aria-hidden>→</span>
                        </span>
                      </span>
                    </div>
                  </a>
                ),
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="pt-6 pb-14 px-6 sm:px-12 md:px-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                How lix works
              </h2>
            </div>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,260px)_1fr]">
              <div className="flex flex-col justify-between gap-4">
                {howItWorksSteps.map(
                  ({ number, title, description, offsetClass }) => (
                    <div
                      key={number}
                      className={`flex flex-col gap-2 ${offsetClass}`}
                    >
                      <span className="text-sm font-semibold text-gray-500">
                        Step {number}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900">
                        {title}
                      </h3>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  ),
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 rounded-t-2xl border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <span className="flex h-3 w-3 rounded-full bg-red-400" />
                  <span className="flex h-3 w-3 rounded-full bg-yellow-300" />
                  <span className="flex h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-xs font-medium text-gray-500">
                    example.ts
                  </span>
                </div>
                <pre className="overflow-x-auto px-6 py-6 text-sm leading-7 text-gray-900 bg-white">
                  <code>
                    <span className="text-indigo-600">import</span>{" "}
                    <span className="text-gray-900">
                      {"{ openLix, selectWorkingDiff, newLixFile }"}
                    </span>{" "}
                    <span className="text-indigo-600">from</span>{" "}
                    <span className="text-amber-600">"@lix-js/sdk";</span>
                    <br />
                    <span className="text-indigo-600">import</span>{" "}
                    <span className="text-gray-900">
                      {"{ plugin as json }"}
                    </span>{" "}
                    <span className="text-indigo-600">from</span>{" "}
                    <span className="text-amber-600">
                      "@lix-js/plugin-json";
                    </span>
                    <br />
                    <br />
                    <span className="text-gray-500">// 1) Create a lix</span>
                    <br />
                    <span className="text-indigo-600">const</span>{" "}
                    <span className="text-sky-700">lix</span>{" "}
                    <span className="text-indigo-600">=</span>{" "}
                    <span className="text-indigo-600">await</span>{" "}
                    <span className="text-sky-700">openLix</span>
                    <span className="text-gray-900">(</span>
                    <span className="text-gray-900">{"{"}</span>
                    <br />
                    {"  "}
                    <span className="text-sky-700">providePlugins</span>
                    <span className="text-gray-900">:</span>{" "}
                    <span className="text-gray-900">[</span>
                    <span className="text-sky-700">json</span>
                    <span className="text-gray-900">]</span>
                    <br />
                    <span className="text-gray-900">{"});"}</span>
                    <br />
                    <br />
                    <span className="text-gray-500">
                      // 2) Write a file via SQL
                    </span>
                    <br />
                    <span className="text-indigo-600">await</span>{" "}
                    <span className="text-sky-700">lix</span>
                    <span className="text-gray-900">.</span>
                    <span className="text-sky-700">db</span>
                    <br />
                    {"  "}
                    <span className="text-gray-900">.</span>
                    <span className="text-sky-700">insertInto</span>
                    <span className="text-gray-900">(</span>
                    <span className="text-amber-600">"file"</span>
                    <span className="text-gray-900">)</span>
                    <br />
                    {"  "}
                    <span className="text-gray-900">.</span>
                    <span className="text-sky-700">values</span>
                    <span className="text-gray-900">(</span>
                    <span className="text-gray-900">{"{"}</span>
                    <br />
                    {"    "}
                    <span className="text-sky-700">path</span>
                    <span className="text-gray-900">:</span>{" "}
                    <span className="text-amber-600">"/settings.json"</span>
                    <span className="text-gray-900">,</span>
                    <br />
                    {"    "}
                    <span className="text-sky-700">data</span>
                    <span className="text-gray-900">:</span>{" "}
                    <span className="text-indigo-600">new</span>{" "}
                    <span className="text-sky-700">TextEncoder</span>
                    <span className="text-gray-900">().</span>
                    <span className="text-sky-700">encode</span>
                    <span className="text-gray-900">(</span>
                    <br />
                    {"      "}
                    <span className="text-sky-700">JSON</span>
                    <span className="text-gray-900">.</span>
                    <span className="text-sky-700">stringify</span>
                    <span className="text-gray-900">(</span>
                    <span className="text-gray-900">{"{"}</span>{" "}
                    <span className="text-sky-700">theme</span>
                    <span className="text-gray-900">:</span>{" "}
                    <span className="text-amber-600">"light"</span>{" "}
                    <span className="text-gray-900">{"}"}</span>
                    <span className="text-gray-900">)</span>
                    <br />
                    {"    "}
                    <span className="text-gray-900">),</span>
                    <br />
                    <span className="text-gray-900">{"  })"}</span>
                    <br />
                    {"  "}
                    <span className="text-gray-900">.</span>
                    <span className="text-sky-700">execute</span>
                    <span className="text-gray-900">();</span>
                    <br />
                    <br />
                    <span className="text-gray-500">// 3) Log the changes</span>
                    <br />
                    <span className="text-indigo-600">const</span>{" "}
                    <span className="text-sky-700">diff</span>{" "}
                    <span className="text-indigo-600">=</span>{" "}
                    <span className="text-indigo-600">await</span>{" "}
                    <span className="text-sky-700">selectWorkingDiff</span>
                    <span className="text-gray-900">(</span>
                    <span className="text-gray-900">{"{"}</span>{" "}
                    <span className="text-sky-700">lix</span>{" "}
                    <span className="text-gray-900">{"}"}</span>
                    <span className="text-gray-900">).</span>
                    <span className="text-sky-700">execute</span>
                    <span className="text-gray-900">();</span>
                    <br />
                    <span className="text-sky-700">console</span>
                    <span className="text-gray-900">.</span>
                    <span className="text-sky-700">log</span>
                    <span className="text-gray-900">(</span>
                    <span className="text-sky-700">diff</span>
                    <span className="text-gray-900">);</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Spotlights */}
        <section className="py-12 px-6 sm:px-12 md:px-16 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
              Lix enables the most powerful AI apps
            </h2>
            <div className="mt-12 flex flex-col gap-12">
              {featureSpotlights.map(
                ({ id, title, description, Illustration }) => (
                  <div
                    key={id}
                    className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]"
                  >
                    <div className="max-w-md md:max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                      </h3>
                      <p className="mt-3 text-sm sm:text-base text-gray-600">
                        {description}
                      </p>
                    </div>
                    <div className="flex justify-center md:justify-end">
                      <Illustration />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Learn More Section */}
        <section className="py-14 px-6 sm:px-12 md:px-16 bg-white border-t border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <a
              href="https://lix.dev/guide/index.html"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden>📘</span>
              Go to Docs
            </a>
            <a
              href="https://discord.gg/GhjdFXsEgM"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden>💬</span>
              Join Discord
            </a>
            <a
              href="https://github.com/opral/lix-sdk"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden>🐙</span>
              Visit GitHub
            </a>
            <a
              href="https://opral.substack.com/t/lix"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden>→</span>
              Read Substack
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
