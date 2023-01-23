export function Figure(props: { src: string; alt: string; caption: string }) {
  return (
    <figure>
      <img src={props.src} alt={props.alt} />
      <figcaption>{props.caption}</figcaption>
    </figure>
  );
}
