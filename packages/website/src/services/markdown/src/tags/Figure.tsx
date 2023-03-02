export function Figure(props: {
  src: string;
  alt: string;
  caption: string;
  height: string;
  width: string;
}) {
  return (
    <figure>
      <div class={`${props.width} ${props.height}`}>
        <img src={props.src} alt={props.alt} />
      </div>
      <figcaption>{props.caption}</figcaption>
    </figure>
  );
}
