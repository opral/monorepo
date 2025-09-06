const IconGroup = () => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 relative"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M3 7V5C3 3.9 3.9 3 5 3H7M17 3H19C20.1 3 21 3.9 21 5V7M21 17V19C21 20.1 20.1 21 19 21H17M7 21H5C3.9 21 3 20.1 3 19V17"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={14} cy={13} r={3} stroke="currentColor" strokeWidth={2} />
      <circle cx={11} cy={10} r={3} fill="white" stroke="currentColor" strokeWidth={2} />
    </svg>
  )
}

export default IconGroup