import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    // Polyfills Buffer, process, crypto for fhevmjs and @zama-fhe/relayer-sdk WASM modules
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "relayer-sdk": ["@zama-fhe/relayer-sdk/web"],
          ethers: ["ethers"],
        },
      },
    },
  },
  optimizeDeps: {
    // @zama-fhe/relayer-sdk/web loads WASM via new URL('*.wasm', import.meta.url).
    // esbuild breaks this pattern — exclude so Vite serves it as native ESM instead.
    exclude: ["@zama-fhe/relayer-sdk/web"],
    include: ["buffer", "ethers"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
