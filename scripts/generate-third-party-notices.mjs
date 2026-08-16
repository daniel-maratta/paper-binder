#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repoRoot, "THIRD-PARTY-NOTICES.md");
const args = new Set(process.argv.slice(2));
const shouldCheck = args.has("--check");
const shouldWrite = args.has("--write") || !shouldCheck;

const nugetLicenseMetadata = {
  "coverlet.collector": { license: "MIT", projectUrl: "https://github.com/coverlet-coverage/coverlet" },
  Dapper: { license: "Apache-2.0", projectUrl: "https://github.com/DapperLib/Dapper" },
  "Microsoft.EntityFrameworkCore.Design": { license: "MIT", projectUrl: "https://github.com/dotnet/efcore" },
  "Microsoft.Extensions.DependencyInjection.Abstractions": { license: "MIT", projectUrl: "https://github.com/dotnet/runtime" },
  "Microsoft.Extensions.Hosting": { license: "MIT", projectUrl: "https://github.com/dotnet/runtime" },
  "Microsoft.Extensions.Identity.Core": { license: "MIT", projectUrl: "https://github.com/dotnet/aspnetcore" },
  "Microsoft.NET.Test.Sdk": { license: "MIT", projectUrl: "https://github.com/microsoft/vstest" },
  Npgsql: { license: "PostgreSQL", projectUrl: "https://github.com/npgsql/npgsql" },
  "Npgsql.EntityFrameworkCore.PostgreSQL": { license: "PostgreSQL", projectUrl: "https://github.com/npgsql/efcore.pg" },
  "OpenTelemetry.Exporter.Console": { license: "Apache-2.0", projectUrl: "https://github.com/open-telemetry/opentelemetry-dotnet" },
  "OpenTelemetry.Exporter.OpenTelemetryProtocol": {
    license: "Apache-2.0",
    projectUrl: "https://github.com/open-telemetry/opentelemetry-dotnet"
  },
  "OpenTelemetry.Extensions.Hosting": {
    license: "Apache-2.0",
    projectUrl: "https://github.com/open-telemetry/opentelemetry-dotnet"
  },
  "OpenTelemetry.Instrumentation.AspNetCore": {
    license: "Apache-2.0",
    projectUrl: "https://github.com/open-telemetry/opentelemetry-dotnet-contrib"
  },
  "Testcontainers.PostgreSql": { license: "MIT", projectUrl: "https://github.com/testcontainers/testcontainers-dotnet" },
  xunit: { license: "Apache-2.0", projectUrl: "https://github.com/xunit/xunit" },
  "xunit.runner.visualstudio": { license: "Apache-2.0", projectUrl: "https://github.com/xunit/visualstudio.xunit" }
};

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function normalizeNewlines(value) {
  return value.replace(/\r\n?/g, "\n");
}

function packageNameFromLockPath(lockPath) {
  const finalNodeModulesIndex = lockPath.lastIndexOf("node_modules/");
  const packagePath = lockPath.slice(finalNodeModulesIndex + "node_modules/".length);
  const parts = packagePath.split("/");

  if (parts[0]?.startsWith("@")) {
    return `${parts[0]}/${parts[1]}`;
  }

  return parts[0];
}

function readNpmPackages() {
  const packageJson = JSON.parse(readText("src/PaperBinder.Web/package.json"));
  const packageLock = JSON.parse(readText("src/PaperBinder.Web/package-lock.json"));
  const directRuntime = new Set(Object.keys(packageJson.dependencies ?? {}));
  const directDevelopment = new Set(Object.keys(packageJson.devDependencies ?? {}));
  const packages = new Map();

  for (const [lockPath, packageEntry] of Object.entries(packageLock.packages ?? {})) {
    if (lockPath === "" || !lockPath.includes("node_modules/")) {
      continue;
    }

    const name = packageNameFromLockPath(lockPath);
    const license = typeof packageEntry.license === "string" ? packageEntry.license : "UNSPECIFIED";
    const rootPackagePath = `node_modules/${name}`;
    const scope = lockPath === rootPackagePath && directRuntime.has(name)
      ? "runtime-direct"
      : lockPath === rootPackagePath && directDevelopment.has(name)
        ? "development-direct"
        : "transitive";
    const key = `${name}@${packageEntry.version ?? "unknown"}|${license}|${scope}`;

    packages.set(key, {
      name,
      version: packageEntry.version ?? "unknown",
      license,
      scope
    });
  }

  return [...packages.values()].sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`, "en", { sensitivity: "base" })
  );
}

function readMsBuildProperties() {
  const props = readText("Directory.Build.props");
  const values = new Map();
  const propertyRegex = /<([^\/][^>\s]+)>([^<]+)<\/\1>/g;

  for (const match of props.matchAll(propertyRegex)) {
    values.set(match[1], match[2]);
  }

  return values;
}

function readProjectFiles(rootRelativePath) {
  const root = path.join(repoRoot, rootRelativePath);
  const files = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absoluteEntryPath = path.join(root, entry.name);
    const relativeEntryPath = path.relative(repoRoot, absoluteEntryPath).replaceAll(path.sep, "/");

    if (entry.isDirectory()) {
      files.push(...readProjectFiles(relativeEntryPath));
    } else if (entry.isFile() && entry.name.endsWith(".csproj")) {
      files.push(relativeEntryPath);
    }
  }

  return files;
}

function resolveNuGetVersion(rawVersion, properties) {
  const propertyReference = /^\$\(([^)]+)\)$/.exec(rawVersion);
  if (propertyReference === null) {
    return rawVersion;
  }

  const resolvedVersion = properties.get(propertyReference[1]);
  if (resolvedVersion === undefined) {
    throw new Error(`Unable to resolve NuGet version property ${rawVersion}.`);
  }

  return resolvedVersion;
}

function classifyNuGetScope(projectPath) {
  if (projectPath.startsWith("tests/")) {
    return "test";
  }

  if (projectPath.includes("/PaperBinder.Migrations/")) {
    return "migration";
  }

  return "runtime";
}

function readNuGetPackages() {
  const properties = readMsBuildProperties();
  const projectFiles = [...readProjectFiles("src"), ...readProjectFiles("tests")].sort();
  const packageReferences = new Map();
  const packageReferenceRegex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g;

  for (const projectFile of projectFiles) {
    const projectText = readText(projectFile);
    for (const match of projectText.matchAll(packageReferenceRegex)) {
      const name = match[1];
      const version = resolveNuGetVersion(match[2], properties);
      const metadata = nugetLicenseMetadata[name];

      if (metadata === undefined) {
        throw new Error(`NuGet package ${name} is missing license metadata in scripts/generate-third-party-notices.mjs.`);
      }

      const key = `${name}@${version}`;
      const existing = packageReferences.get(key) ?? {
        name,
        version,
        license: metadata.license,
        projectUrl: metadata.projectUrl,
        scopes: new Set(),
        projects: new Set()
      };

      existing.scopes.add(classifyNuGetScope(projectFile));
      existing.projects.add(projectFile);
      packageReferences.set(key, existing);
    }
  }

  return [...packageReferences.values()].sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`, "en", { sensitivity: "base" })
  );
}

function renderNpmTable(packages) {
  const lines = [
    "| Package | Version | License | Scope |",
    "| --- | --- | --- | --- |"
  ];

  for (const packageEntry of packages) {
    lines.push(`| \`${packageEntry.name}\` | \`${packageEntry.version}\` | ${packageEntry.license} | ${packageEntry.scope} |`);
  }

  return lines.join("\n");
}

function renderNuGetTable(packages) {
  const lines = [
    "| Package | Version | License | Scope | Referenced by | Project |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const packageEntry of packages) {
    const scopes = [...packageEntry.scopes].sort().join(", ");
    const projects = [...packageEntry.projects].sort().map((project) => `\`${project}\``).join("<br>");
    lines.push(
      `| \`${packageEntry.name}\` | \`${packageEntry.version}\` | ${packageEntry.license} | ${scopes} | ${projects} | ${packageEntry.projectUrl} |`
    );
  }

  return lines.join("\n");
}

function renderNotice() {
  const npmPackages = readNpmPackages();
  const nugetPackages = readNuGetPackages();
  const npmLicenseCounts = new Map();

  for (const packageEntry of npmPackages) {
    npmLicenseCounts.set(packageEntry.license, (npmLicenseCounts.get(packageEntry.license) ?? 0) + 1);
  }

  const npmLicenseSummary = [...npmLicenseCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([license, count]) => `- ${license}: ${count}`)
    .join("\n");

  return normalizeNewlines(`# Third-Party Notices

Generated by \`scripts/generate-third-party-notices.mjs\`.

Run \`node scripts/generate-third-party-notices.mjs --check\` to verify this file matches the current dependency manifests.

## Scope

This file inventories the third-party package dependencies currently declared by PaperBinder's frontend npm lockfile and direct .NET \`PackageReference\` entries. It is intended as a small, deterministic repository notice, not a full license-compliance platform.

PaperBinder source code and project documentation are licensed under the repository [MIT License](./LICENSE) unless a file states otherwise. Third-party packages remain governed by their own license terms. This notice does not relicense any third-party package, trademark, service, or provider asset.

## npm License Summary

Source: \`src/PaperBinder.Web/package-lock.json\`

${npmLicenseSummary}

## npm Packages

${renderNpmTable(npmPackages)}

## NuGet Direct Packages

Source: direct \`PackageReference\` entries in \`src/**/*.csproj\` and \`tests/**/*.csproj\`, with versions resolved from \`Directory.Build.props\`.

${renderNuGetTable(nugetPackages)}

## Provider And Browser Surfaces

This dependency notice is separate from the legal Privacy Policy and Cookie Notice. Cloudflare Turnstile, DigitalOcean, GitHub Actions/GHCR, DNS/TLS providers, and optional telemetry exporters are provider surfaces described in the legal/retention documents when they process runtime, deployment, or operational data.
`);
}

const expectedNotice = renderNotice();

if (shouldCheck) {
  const actualNotice = fs.existsSync(outputPath) ? normalizeNewlines(fs.readFileSync(outputPath, "utf8")) : "";
  if (actualNotice !== expectedNotice) {
    console.error("THIRD-PARTY-NOTICES.md is out of date. Run `node scripts/generate-third-party-notices.mjs --write`.");
    process.exit(1);
  }

  console.log("THIRD-PARTY-NOTICES.md is up to date.");
}

if (shouldWrite) {
  fs.writeFileSync(outputPath, expectedNotice, "utf8");
  console.log(`Wrote ${path.relative(repoRoot, outputPath).replaceAll(path.sep, "/")}.`);
}
