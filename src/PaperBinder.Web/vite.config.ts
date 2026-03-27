import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const envRoot = fileURLToPath(new URL("../..", import.meta.url));
const frontendKeys = [
  "VITE_PAPERBINDER_ROOT_URL",
  "VITE_PAPERBINDER_API_BASE_URL",
  "VITE_PAPERBINDER_TENANT_BASE_DOMAIN"
] as const;

function validateFrontendEnvironment(mode: string) {
  const env = loadEnv(mode, envRoot, "");

  for (const key of frontendKeys) {
    const value = env[key]?.trim();
    if (!value) {
      throw new Error(`Missing required frontend environment variable ${key}.`);
    }

    if (key !== "VITE_PAPERBINDER_TENANT_BASE_DOMAIN") {
      new URL(value);
      continue;
    }

    if (value.includes("://") || value.includes("/")) {
      throw new Error(
        "VITE_PAPERBINDER_TENANT_BASE_DOMAIN must be a host or host:port value."
      );
    }
  }
}

export default defineConfig(({ mode }) => {
  validateFrontendEnvironment(mode);

  return {
    envDir: "../..",
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "dist",
      emptyOutDir: true
    }
  };
});
