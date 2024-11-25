import clsx from "clsx"

const IconChevron = ({ ...props }) => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(props.className, "w-6 h-6 relative")}
      
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
    </svg>
  )
}

export default IconChevron