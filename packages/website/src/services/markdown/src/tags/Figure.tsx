export function Figure(props: {
  src: string;
  alt: string;
  caption: string;
  height: string;
  width: string;
}) {
  return (
    <figure>
      <img
        src={props.src}
        alt={props.alt}
        height={props.height}
        width={props.width}
      />
      <figcaption>{props.caption}</figcaption>
    </figure>
  );
}
