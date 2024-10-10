const Details = (props: { summary: string, content: string }) => {
  return (
    <details>
      <summary className="cursor-pointer font-semibold text-slate-500 list-none after:content-['']">
        {props.summary}
      </summary>
      <p className="mt-2">{props.content}</p>
    </details>
  );
}

export default Details