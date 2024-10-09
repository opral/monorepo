import IconSubstack from "./icons/substack";

const footerLinks = [
  {
    title: "GitHub",
    link: "https://lix.opral.com",
  },
  {
    title: "Twitter",
    link: "https://x.com/lixCCS",
  },
  {
    title: "Email",
    link: "mailto:hello@opral.com",
  },
]

export const Footer = () => {
  return (
    <>
      <div className="w-full h-[1px] bg-slate-200 my-16"></div><div className="w-full max-w-2xl px-4 mx-auto my-16">
        <p className="mt-12 mb-4 text-slate-950 font-medium">© Lix by Opral</p>
        <ul className="leading-[1.7] pl-0 list-none flex gap-2">
          {footerLinks.map(
            (link) =>
              <li>
                <a
                  className="text-slate-600 underline decoration-slate-300 font-medium hover:decoration-slate-950"
                  href={link.link}
                >
                  {link.title}
                </a>
              </li>
          )}
        </ul>
        <a
          href="https://opral.substack.com/"
          target="_blanc"
          className="mt-2 w-fit text-[16px] px-4 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer flex items-center gap-2 no-underline"
        >
          <IconSubstack />
          Subscribe our Substack
        </a>
      </div></>
  )
}

export default Footer;