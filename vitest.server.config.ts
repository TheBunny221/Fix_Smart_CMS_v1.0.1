import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    // Reporter configuration
    reporters: ["verbose"],
  },
  resolve: {
    alias: {
      "@server": path.resolve(__dirname, "./server"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    // Define environment variables for tests
    "process.env.NODE_ENV": '"test"',
  },
});