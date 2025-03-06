const Banner = () => {
  return (
    <div className="bg-slate-500 text-white text-center p-1.5">
      <span className="font-medium">
        This is a public preview. Report bugs on{" "}
        <a
          className="underline"
          href="https://github.com/opral/lix-sdk/issues"
          target="__blank"
        >
          GitHub
        </a>{" "}
        and join{" "}
        <a
          href="https://discord.gg/xjQA897RyK"
          target="__blank"
          className="underline"
        >
          Discord
        </a>{" "}
        for questions.
      </span>
    </div>
  );
}

export default Banner;