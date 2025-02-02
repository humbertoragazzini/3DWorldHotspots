// vite.config.js
import glsl from "vite-plugin-glsl";
// const path = require("path");
// console.log(path.resolve(__dirname, "node_modules/jquery"));

export default {
  root: "./src",
  publicDir: "../static",
  base: "./",
  resolve: {
    // alias: {
    //   "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
    //   "~jquery": path.resolve(__dirname, "node_modules/jquery"),
    // },
    alias: {
      "~bootstrap":
        "C:/Users/h.ragazzini/Practice/3DMAP/3D_World_Hotspots_V.1.0/node_modules/bootstrap",
      "~jquery":
        "C:/Users/h.ragazzini/Practice/3DMAP/3D_World_Hotspots_V.1.0/node_modulesjquery",
    },
  },
  plugins: [
    glsl({
      include: [
        // Glob pattern, or array of glob patterns to import
        "**/*.glsl",
        "**/*.wgsl",
        "**/*.vert",
        "**/*.frag",
        "**/*.vs",
        "**/*.fs",
      ],
      exclude: undefined, // Glob pattern, or array of glob patterns to ignore
      warnDuplicatedImports: true, // Warn if the same chunk was imported multiple times
      defaultExtension: "glsl", // Shader suffix when no extension is specified
      compress: false, // Compress output shader code
      watch: true, // Recompile shader on change
      root: "/", // Directory for root imports
    }),
  ],
  server: {
    host: true, // Open to local network and display URL
    open: !("SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env), // Open if it's not a CodeSandbox
  },
  build: {
    outDir: "../dist", // Output in the dist/ folder
    emptyOutDir: true, // Empty the folder first
    sourcemap: true, // Add sourcemap
  },
};
