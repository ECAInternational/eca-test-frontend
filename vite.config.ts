import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      appDirectory: "src/app",
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  publicDir: "public",
  server: {
    port: 5180,
    hmr: {
      overlay: true,
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        app: "./src/app/entry.client.tsx",
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  resolve: {
    alias: {
      'remix:manifest': '@remix-run/dev/server-build',
    },
  },
});
