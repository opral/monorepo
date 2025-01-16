import hello from "./hello.js";
const uiUrl = import.meta.env.VITE_CUSTOM_URL;

function bootstrap() {
  console.log("Hello from the plugin!");
  hello("world");

  figma.showUI(`<script>window.location.href = "${uiUrl}"</script>`, {
    width: 1200,
    height: 600,
  });
}

bootstrap();
