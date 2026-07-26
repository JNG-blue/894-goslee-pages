
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

console.log("LOADED VITEST CONFIG", resolve(process.cwd()));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(process.cwd()),
      },
      {
        find: /^@\//,
        replacement: `${resolve(process.cwd())}/`,
      },
    ],
  },
  test: {
    environment: "node",
  },
});