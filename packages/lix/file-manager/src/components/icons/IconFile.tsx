const IconFile = ({ ...props }) => {
  return (
    <svg
      {...props}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 relative"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M13.5 4H7.5C7.10218 4 6.72064 4.16857 6.43934 4.46863C6.15804 4.76869 6 5.17565 6 5.6V18.4C6 18.8243 6.15804 19.2313 6.43934 19.5314C6.72064 19.8314 7.10218 20 7.5 20H16.5C16.8978 20 17.2794 19.8314 17.5607 19.5314C17.842 19.2313 18 18.8243 18 18.4V8.8L13.5 4ZM16.5 18.4H7.5V5.6H12.75V9.6H16.5V18.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default IconFile