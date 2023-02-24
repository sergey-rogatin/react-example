import esbuild from "esbuild";
import htmlPlugin from "@chialab/esbuild-plugin-html";
import cssModulesPlugin from "esbuild-css-modules-plugin";

const context = await esbuild.context({
  entryPoints: ["src/index.html"],
  bundle: true,
  sourcemap: true,
  outfile: "dist/output.js",
  plugins: [htmlPlugin(), cssModulesPlugin({})],
});

// Manually do an incremental build
await context.rebuild();

// Enable watch mode
await context.watch();

// Enable serve mode
await context.serve({ servedir: "dist", port: 3000 });
