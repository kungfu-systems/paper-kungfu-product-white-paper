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

const brandBundle = readJson("site/brand-site.json");
if (brandBundle.routes?.canonicalUrl !== "https://kungfu.tech/whitepaper/kungfu-real-world-agent-work") {
  fail("brand site bundle must declare the kungfu.tech canonical white paper URL");
}
if (brandBundle.routes?.indexUrl !== "https://kungfu.tech/whitepaper") {
  fail("brand site bundle must declare the kungfu.tech white paper index URL");
}
if (brandBundle.routes?.pdfUrl !== "https://kungfu.tech/whitepaper/kungfu-real-world-agent-work.pdf") {
  fail("brand site bundle must declare the kungfu.tech canonical PDF URL");
}
if (brandBundle.hero?.primaryCta?.href !== brandBundle.routes?.canonicalUrl) {
  fail("brand site primary CTA must point to routes.canonicalUrl");
}
if (brandBundle.hero?.secondaryCta?.href !== brandBundle.routes?.evidenceUrl) {
  fail("brand site secondary CTA must point to routes.evidenceUrl");
}

const evidenceBundle = readJson("site/evidence-site.json");
if (evidenceBundle.routes?.canonicalUrl !== "https://papers.libkungfu.dev/kungfu-product-white-paper") {
  fail("evidence site bundle must declare the papers.libkungfu.dev canonical URL");
}
if (evidenceBundle.routes?.brandUrl !== brandBundle.routes?.canonicalUrl) {
  fail("evidence site brandUrl must point to the brand canonicalUrl");
}
if (brandBundle.routes?.evidenceUrl !== evidenceBundle.routes?.canonicalUrl) {
  fail("brand site evidenceUrl must point to the evidence canonicalUrl");
}

try {
  execFileSync("git", ["diff", "--check"], { stdio: "pipe" });
} catch (error) {
  fail(error.stdout?.toString() || error.message);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
