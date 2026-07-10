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
for (const requiredFile of [
  "README.md",
  "paper",
  "site",
  "scripts",
  ".buildchain/buildchain.toml",
  ".buildchain/contract-lock.json",
  ".buildchain/publication/publication-artifact.json",
  ".buildchain/publication/publication-artifact-passport.json",
  ".buildchain/publication/publication-registry.json",
  ".buildchain/publication/source.tar.gz",
  "_build/kungfu-real-world-agent-work.pdf",
  "release-impact.json",
]) {
  if (!packageJson.files?.includes(requiredFile)) {
    fail(`package.json files[] must include ${requiredFile}`);
  }
}
for (const requiredExport of [
  "./site/brand-site.json",
  "./site/evidence-site.json",
  "./site/site-bundles.json",
  "./pdf",
  "./buildchain/contract-lock.json",
  "./publication-artifact.json",
  "./publication-artifact-passport.json",
  "./publication-registry.json",
  "./source.tar.gz",
  "./release-impact.json",
  "./scripts/*.mjs",
]) {
  if (!packageJson.exports?.[requiredExport]) {
    fail(`package.json exports must include ${requiredExport}`);
  }
}
if (packageJson.exports?.["./pdf"] !== "./_build/kungfu-real-world-agent-work.pdf") {
  fail("package.json ./pdf export must point to the declared public PDF filename");
}
if (packageJson.publishConfig?.registry !== "https://registry.npmjs.org/" || packageJson.publishConfig?.access !== "public") {
  fail("package.json publishConfig must target public npmjs");
}
const contractLock = readJson(".buildchain/contract-lock.json");
if (contractLock.contract !== "kungfu-buildchain-contract-lock") {
  fail(".buildchain/contract-lock.json must be a Buildchain contract lock");
}
if (contractLock.buildchain?.ref !== "v2") {
  fail(".buildchain/contract-lock.json must lock the Buildchain v2 floating ref");
}
const releaseImpact = readJson("release-impact.json");
if (releaseImpact.contract !== "kungfu-buildchain-impact") {
  fail("release-impact.json must use the kungfu-buildchain-impact contract");
}
if (releaseImpact.versionImpact?.final !== "minor") {
  fail("initial release impact must be minor");
}
if (!Array.isArray(releaseImpact.surfaceImpacts) || releaseImpact.surfaceImpacts.length === 0) {
  fail("release-impact.json must declare surfaceImpacts");
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
if (evidenceBundle.routes?.pdfUrl !== "https://papers.libkungfu.dev/kungfu-product-white-paper/kungfu-real-world-agent-work.pdf") {
  fail("evidence site bundle must declare the public PDF URL");
}

try {
  execFileSync("git", ["diff", "--check"], { stdio: "pipe" });
} catch (error) {
  fail(error.stdout?.toString() || error.message);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
