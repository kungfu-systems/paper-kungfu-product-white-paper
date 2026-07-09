import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { buildSiteBundles } from "./update-site-bundles.mjs";

const fail = (message) => {
  console.error(`check: ${message}`);
  process.exitCode = 1;
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const stable = (value) => `${JSON.stringify(value, null, 2)}\n`;

for (const [path, expected] of Object.entries(buildSiteBundles())) {
  let actual;
  try {
    actual = readJson(path);
  } catch (error) {
    fail(`${path} is missing or invalid JSON: ${error.message}`);
    continue;
  }
  if (stable(actual) !== stable(expected)) {
    fail(`${path} is stale; run npm run update:site-bundles`);
  }
}

const packageJson = readJson("package.json");
for (const requiredFile of ["README.md", "paper", "site", "scripts", ".buildchain/buildchain.toml"]) {
  if (!packageJson.files?.includes(requiredFile)) {
    fail(`package.json files[] must include ${requiredFile}`);
  }
}
for (const requiredExport of ["./site/brand-site.json", "./site/evidence-site.json", "./site/site-bundles.json"]) {
  if (!packageJson.exports?.[requiredExport]) {
    fail(`package.json exports must include ${requiredExport}`);
  }
}

const buildchainText = readFileSync(".buildchain/buildchain.toml", "utf8");
for (const consumer of ["kungfu.tech", "papers.libkungfu.dev"]) {
  if (!buildchainText.includes(`"${consumer}"`)) {
    fail(`buildchain site_consumers must include ${consumer}`);
  }
}

try {
  execFileSync("git", ["diff", "--check"], { stdio: "pipe" });
} catch (error) {
  fail(error.stdout?.toString() || error.message);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
