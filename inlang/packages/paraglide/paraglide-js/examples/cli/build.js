import { compile } from "@inlang/paraglide-js/compiler";

console.log("Compiling project...");

const startTime = Date.now();

await compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
});

const endTime = Date.now();

console.log("Project compiled successfully!");
console.log(`Time taken: ${endTime - startTime}ms`);
