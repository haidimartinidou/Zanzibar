import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(async ({ command }) => {
  const plugins: any[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
  ];

  if (command === "build") {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.push(cloudflare({ viteEnvironment: { name: "ssr" } }));
  }

  plugins.push(
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      tsr: {
        routeFileIgnorePrefix: "-",
        quoteStyle: "single",
      },
    }),
    react(),
  );

  return {
    plugins,
    // Bake public (non-secret) env vars into the client bundle so they work
    // in Cloudflare CI where the .env file is not present (it's gitignored).
    // These values are already in wrangler.jsonc as plaintext — same security level.
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        "https://ubqnwxgjcsgotzglgmzc.supabase.co"
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        "sb_publishable_PIWISPMpcwzuRsADonhjYQ_Td6QAqkb"
      ),
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
