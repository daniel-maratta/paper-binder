import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const envRoot = fileURLToPath(new URL("../..", import.meta.url));
const frontendKeys = [
  "VITE_PAPERBINDER_ROOT_URL",
  "VITE_PAPERBINDER_API_BASE_URL",
  "VITE_PAPERBINDER_TENANT_BASE_DOMAIN"
] as const;
type FrontendKey = (typeof frontendKeys)[number];
type FrontendEnvValues = Record<FrontendKey, string>;

function parseEnvFile(path: string): Record<string, string> {
  const env: Record<string, string> = {};

  if (!existsSync(path)) {
    return env;
  }

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value =
      rawValue.length >= 2 &&
      ((rawValue.startsWith("\"") && rawValue.endsWith("\"")) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'")))
        ? rawValue.slice(1, -1)
        : rawValue;

    env[key] = value;
  }

  return env;
}

function loadPaperBinderEnv(mode: string) {
  const exampleEnv = parseEnvFile(join(envRoot, ".env.example"));
  const localEnv = loadEnv(mode, envRoot, "");

  return {
    ...exampleEnv,
    ...localEnv
  };
}

function resolveFrontendEnvironmentValues(mode: string): FrontendEnvValues {
  const env = loadPaperBinderEnv(mode);
  const resolvedEnv = {} as FrontendEnvValues;

  for (const key of frontendKeys) {
    const value = env[key]?.trim();
    if (!value) {
      throw new Error(`Missing required frontend environment variable ${key}.`);
    }

    if (key !== "VITE_PAPERBINDER_TENANT_BASE_DOMAIN") {
      new URL(value);
      resolvedEnv[key] = value;
      continue;
    }

    if (value.includes("://") || value.includes("/")) {
      throw new Error(
        "VITE_PAPERBINDER_TENANT_BASE_DOMAIN must be a host or host:port value."
      );
    }

    resolvedEnv[key] = value;
  }

  return resolvedEnv;
}

export default defineConfig(({ mode }) => {
  const frontendEnv = resolveFrontendEnvironmentValues(mode);

  return {
    envDir: "../..",
    define: {
      __PAPERBINDER_FRONTEND_ENV_FALLBACK__: JSON.stringify(frontendEnv)
    },
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "dist",
      emptyOutDir: true
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      passWithNoTests: false
    }
  };
});
