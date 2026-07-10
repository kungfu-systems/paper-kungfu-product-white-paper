#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";

function run(command, args, { env = process.env, encoding } = {}) {
  const result = spawnSync(command, args, { stdio: encoding ? "pipe" : "inherit", env, encoding });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result;
}

function runShell(command, { env = process.env } = {}) {
  const result = spawnSync("bash", ["-lc", command], { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`bash -lc ${JSON.stringify(command)} failed with exit code ${result.status}`);
  }
}

function loadPublicationToolchain() {
  const result = run("npx", ["--no-install", "buildchain", "validate", "--json"], { encoding: "utf8" });
  const summary = JSON.parse(result.stdout);
  return summary.publication?.toolchain || { type: "custom-command", command: "make pdf" };
}

function buildWithToolchain(toolchain, { sourceDateEpoch }) {
  if (toolchain.type === "latex-docker") {
    const imageRef = `${toolchain.image}@${toolchain.digest}`;
    run("docker", ["pull", imageRef]);
    run("docker", [
      "run",
      "--rm",
      "-e",
      `SOURCE_DATE_EPOCH=${sourceDateEpoch}`,
      "-v",
      `${process.cwd()}:/workspace`,
      "-w",
      "/workspace",
      imageRef,
      "bash",
      "-lc",
      toolchain.command,
    ]);
    return;
  }
  if (toolchain.type === "custom-command") {
    runShell(toolchain.command || "make pdf", {
      env: {
        ...process.env,
        SOURCE_DATE_EPOCH: sourceDateEpoch,
      },
    });
    return;
  }
  throw new Error(`unsupported publication toolchain: ${toolchain.type}`);
}

const sourceSha = process.env.BUILDCHAIN_SOURCE_SHA || spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).stdout.trim();
const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH || run("git", [
  "log",
  "-1",
  "--format=%ct",
  sourceSha,
], { encoding: "utf8" }).stdout.trim();
const generatedAt = process.env.BUILDCHAIN_PUBLICATION_GENERATED_AT ||
  new Date(Number(sourceDateEpoch) * 1000).toISOString();
const sourceMtime = new Date(Number(sourceDateEpoch) * 1000);
const toolchain = loadPublicationToolchain();

buildWithToolchain(toolchain, { sourceDateEpoch });
run("npx", [
  "--no-install",
  "buildchain",
  "publication-artifact",
  "manifest",
  "--source-sha",
  sourceSha,
  "--generated-at",
  generatedAt,
  "--json",
]);

for (const path of [
  "_build/kungfu-managing-real-world-work-with-agents.pdf",
  ".buildchain/publication/publication-artifact.json",
  ".buildchain/publication/publication-artifact-passport.json",
  ".buildchain/publication/publication-registry.json",
  ".buildchain/publication/source.tar.gz",
]) {
  if (fs.existsSync(path)) fs.utimesSync(path, sourceMtime, sourceMtime);
}
