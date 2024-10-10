const Details = (props: { summary: string, content: string }) => {
  return (
    <details>
      <summary className="flex cursor-pointer font-medium text-slate-500 list-none hover:text-cyan-500 
        after:inline-block after:w-6 after:h-6 after:ml-auto after:bg-contain after:bg-[url('/images/chevron-down.svg')] after:transform after:rotate-0 after:transition-transform after:duration-200 after:ease-in-out"
      >
        {props.summary}
      </summary>
      <p className="my-3">{props.content}</p>
    </details>
  );
}

export default Details
