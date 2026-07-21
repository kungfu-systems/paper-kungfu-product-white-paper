import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();
const artifactFilename = (path) => String(path || "").split("/").filter(Boolean).pop() || "";

const parseTomlString = (toml, key) => {
  const match = toml.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, "m"));
  return match ? match[1] : "";
};

const parseTomlArray = (toml, key) => {
  const match = toml.match(new RegExp(`^${key}\\s*=\\s*\\[([^\\]]*)\\]`, "m"));
  if (!match) return [];
  return match[1]
    .split(",")
    .map((item) => item.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
};

const parseBuildchain = () => {
  const toml = read(".buildchain/buildchain.toml");
  return {
    title: parseTomlString(toml, "title"),
    abstract: parseTomlString(toml, "abstract"),
    kind: parseTomlString(toml, "kind"),
    primaryArtifact: parseTomlString(toml, "primary_artifact"),
    artifactPaths: parseTomlArray(toml, "artifact_paths"),
    metadataPaths: parseTomlArray(toml, "metadata_paths"),
    sourcePaths: parseTomlArray(toml, "source_paths"),
    siteConsumers: parseTomlArray(toml, "site_consumers"),
  };
};

const packageInfo = () => JSON.parse(read("package.json"));

const normalizeLatex = (latex) => latex
  .replace(/%.*$/gm, "")
  .replace(/\\calloutbox\{([^{}]*)\}\{([^{}]*)\}/g, "\n**$1**\n\n$2\n")
  .replace(/\\begin\{tabularx\}\{[^{}]*\}\{[^{}]*\}/g, "")
  .replace(/\\begin\{tabularx\}\{[^{}]*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, "")
  .replace(/\\end\{tabularx\}/g, "")
  .replace(/\\begin\{tabular\}\{[^{}]*\}/g, "")
  .replace(/\\end\{tabular\}/g, "")
  .replace(/\\begin\{center\}/g, "")
  .replace(/\\end\{center\}/g, "")
  .replace(/\\toprule|\\midrule|\\bottomrule/g, "")
  .replace(/\\begin\{itemize\}\[leftmargin=\*\]/g, "")
  .replace(/\\begin\{itemize\}/g, "")
  .replace(/\\end\{itemize\}/g, "")
  .replace(/\\begin\{enumerate\}\[leftmargin=\*\]/g, "")
  .replace(/\\begin\{enumerate\}/g, "")
  .replace(/\\end\{enumerate\}/g, "")
  .replace(/\\item\s+/g, "- ")
  .replace(/\\subsection\{([^}]*)\}/g, "\n## $1\n")
  .replace(/\\section\{([^}]*)\}/g, "# $1\n")
  .replace(/\\textit\{([^}]*)\}/g, "$1")
  .replace(/\\textbf\{([^}]*)\}/g, "$1")
  .replace(/\\(?:cite|nocite)\{[^}]*\}/g, "")
  .replace(/\s*&\s*/g, " | ")
  .replace(/\s*\\\\\s*/g, "\n")
  .replace(/``/g, "\"")
  .replace(/''/g, "\"")
  .replace(/~/g, " ")
  .replace(/\\&/g, "&")
  .replace(/\\_/g, "_")
  .replace(/\\-/g, "-")
  .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^{}]*)\})?/g, (_, inner) => inner || "")
  .replace(/[{}]/g, "")
  .replace(/[ \t]+\n/g, "\n")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

const parseSection = (path) => {
  const latex = read(path);
  const sectionMatch = latex.match(/\\section\{([^}]*)\}/);
  const title = sectionMatch ? sectionMatch[1] : path;
  const bodyLatex = sectionMatch ? latex.slice(sectionMatch.index + sectionMatch[0].length) : latex;
  const subsections = [...latex.matchAll(/\\subsection\{([^}]*)\}/g)].map((match) => match[1]);
  const markdown = normalizeLatex(latex);
  const paragraphs = normalizeLatex(bodyLatex)
    .split(/\n{2,}/)
    .map((block) => compact(block.replace(/^##\s+.*$/gm, "")))
    .filter(Boolean);
  return {
    id: path.split("/").pop().replace(/\.tex$/, ""),
    title,
    sourcePath: path,
    subsections,
    summary: paragraphs[0] || "",
    markdown,
  };
};

const sectionPaths = () => {
  const main = read("paper/main.tex");
  return [...main.matchAll(/\\input\{sections\/([^}]*)\}/g)].map((match) => `paper/sections/${match[1]}.tex`);
};

const parseReferences = () => {
  const bib = read("paper/references.bib");
  return [...bib.matchAll(/@misc\{([^,]+),([\s\S]*?)\n\}/g)].map((match) => {
    const body = match[2];
    const field = (name) => {
      const fieldMatch = body.match(new RegExp(`${name}\\s*=\\s*\\{([^}]*)\\}`, "m"));
      return fieldMatch ? fieldMatch[1] : "";
    };
    return {
      key: match[1],
      title: field("title"),
      author: field("author"),
      year: field("year"),
      note: field("note"),
    };
  });
};

const buildPrinciples = (sections) => {
  const principles = sections.find((section) => section.id === "06-validation");
  if (!principles) return [];
  const latex = read(principles.sourcePath);
  const foundation = latex.match(/KFD begins with three commitments:([\s\S]*?)\\end\{center\}/)?.[1] || "";
  return [...foundation.matchAll(/(KFD-[0-9]+)\s*&\s*([^\\]+)\\\\/g)].map((match) => ({
    id: match[1],
    text: match[2].trim(),
  }));
};

const siteSection = (section, role, presentation, priority) => ({
  id: section.id,
  sourcePath: section.sourcePath,
  title: section.title,
  role,
  presentation,
  priority,
  summary: section.summary,
  markdown: section.markdown,
});

export const buildSiteBundles = () => {
  const buildchain = parseBuildchain();
  const pkg = packageInfo();
  const pdfFilename = artifactFilename(buildchain.primaryArtifact);
  if (!pdfFilename.endsWith(".pdf")) {
    throw new Error("publication primary_artifact must declare a public PDF filename");
  }
  const sections = sectionPaths().map(parseSection);
  const references = parseReferences();
  const principles = buildPrinciples(sections);
  const sectionById = (id) => sections.find((section) => section.id === id);
  const source = {
    package: pkg.name,
    packageVersion: pkg.version,
    repository: pkg.repository?.url || "",
    titleSource: ".buildchain/buildchain.toml",
    paperEntrypoint: "paper/main.tex",
    sectionSources: sections.map((section) => section.sourcePath),
    bibliography: "paper/references.bib",
    buildchainConfig: ".buildchain/buildchain.toml",
  };

  const brand = {
    schemaVersion: 1,
    contract: "kungfu-white-paper-brand-site-bundle",
    consumer: "kungfu.tech",
    source,
    routes: {
      canonicalHost: "kungfu.tech",
      canonicalPath: "/whitepaper/kungfu-real-world-agent-work",
      canonicalUrl: "https://kungfu.tech/whitepaper/kungfu-real-world-agent-work",
      indexPath: "/whitepaper",
      indexUrl: "https://kungfu.tech/whitepaper",
      pdfPath: `/whitepaper/${pdfFilename}`,
      pdfUrl: `https://kungfu.tech/whitepaper/${pdfFilename}`,
      evidenceUrl: "https://papers.libkungfu.dev/kungfu-product-white-paper",
    },
    hero: {
      title: buildchain.title,
      eyebrow: "Kungfu White Paper",
      lead: buildchain.abstract,
      stance: "Give your agent verified context. Keep the work when the chat ends.",
      primaryCta: {
        label: "Read the white paper",
        href: "https://kungfu.tech/whitepaper/kungfu-real-world-agent-work",
      },
      secondaryCta: {
        label: "Inspect evidence",
        href: "https://papers.libkungfu.dev/kungfu-product-white-paper",
      },
    },
    positioning: {
      audience: ["Agent users", "Agent builders", "runtime engineers", "Hub architects", "technology decision makers"],
      productClaim: "Project Cut is the first user object for verified work continuity across sessions and Agents.",
      philosophicalClaim: "Build your Hub. Do not rebuild the runtime: embed libkungfu now and develop the KFD-compatible Hub boundary in parallel.",
      proofPath: "Source-pinned libkungfu integration, exact KFD coordinates, first-party Project Cut evidence, and Buildchain release provenance.",
    },
    principles,
    homepageSections: [
      siteSection(sectionById("00-executive-summary"), "first-screen", "executive-summary", 10),
      siteSection(sectionById("01-problem"), "primary", "continuity-gap", 20),
      siteSection(sectionById("02-thesis"), "primary", "builder-strategy", 30),
      siteSection(sectionById("03-principles"), "primary", "project-cut", 40),
      siteSection(sectionById("04-architecture"), "primary", "continuity-loop", 50),
      siteSection(sectionById("05-roadmap"), "primary", "runtime-architecture", 60),
      siteSection(sectionById("06-validation"), "primary", "kfd-principles", 70),
      siteSection(sectionById("07-ecosystem"), "primary", "authority-and-evidence", 80),
      siteSection(sectionById("08-risks"), "support", "adoption-and-roadmap", 90),
      siteSection(sectionById("09-conclusion"), "support", "closing-thesis", 100),
    ].filter(Boolean),
    displayPlan: {
      firstScreen: ["hero", "Executive Summary: The Work Must Outlive the Chat"],
      primary: ["The Continuity Gap", "The Strategic Choice for Agent Builders", "Project Cut: The First User Object", "How Work Continues Across Sessions", "The Runtime Beneath the Cut", "KFD and Independent Agent Hubs", "Authority, Trust, and Evidence"],
      support: ["Current State, Adoption, and Roadmap", "Conclusion"],
      hideFromBrandPage: ["full bibliography", "source bundle internals", "raw Buildchain passport fields"],
    },
  };

  const evidence = {
    schemaVersion: 1,
    contract: "kungfu-white-paper-evidence-site-bundle",
    consumer: "papers.libkungfu.dev",
    source,
    publication: {
      kind: buildchain.kind,
      title: buildchain.title,
      abstract: buildchain.abstract,
      primaryArtifact: buildchain.primaryArtifact,
      artifactPaths: buildchain.artifactPaths,
      metadataPaths: buildchain.metadataPaths,
      sourcePaths: buildchain.sourcePaths,
      siteConsumers: buildchain.siteConsumers,
    },
    routes: {
      canonicalHost: "papers.libkungfu.dev",
      canonicalPath: "/kungfu-product-white-paper",
      canonicalUrl: "https://papers.libkungfu.dev/kungfu-product-white-paper",
      pdfPath: `/kungfu-product-white-paper/${pdfFilename}`,
      pdfUrl: `https://papers.libkungfu.dev/kungfu-product-white-paper/${pdfFilename}`,
      sourcePath: "/kungfu-product-white-paper/source.tar.gz",
      sourceUrl: "https://papers.libkungfu.dev/kungfu-product-white-paper/source.tar.gz",
      brandUrl: "https://kungfu.tech/whitepaper/kungfu-real-world-agent-work",
      repositoryUrl: "https://github.com/kungfu-systems/paper-kungfu-product-white-paper",
    },
    sectionMap: sections.map((section, index) => ({
      order: index + 1,
      id: section.id,
      title: section.title,
      sourcePath: section.sourcePath,
      subsections: section.subsections,
      summary: section.summary,
    })),
    references,
    verification: {
      commands: ["npm run check", "npm run build", "npx --no-install buildchain validate --json", "npm pack --dry-run --json"],
      buildchainManifestPath: ".buildchain/publication/publication-artifact.json",
      sourceBundlePath: ".buildchain/publication/source.tar.gz",
      residualRisk: "This is an alpha product and architecture paper based on first-party evidence; it does not establish external vendor adoption, certification, stable Hub interoperability, or broad production readiness.",
    },
  };

  return {
    "site/brand-site.json": brand,
    "site/evidence-site.json": evidence,
    "site/site-bundles.json": {
      schemaVersion: 1,
      contract: "kungfu-white-paper-site-bundles-index",
      source,
      bundles: [
        {
          id: "brand",
          consumer: "kungfu.tech",
          path: "site/brand-site.json",
          contract: brand.contract,
          purpose: "Product and philosophy presentation for the Kungfu main site.",
        },
        {
          id: "evidence",
          consumer: "papers.libkungfu.dev",
          path: "site/evidence-site.json",
          contract: evidence.contract,
          purpose: "Artifact, citation, source, and verification presentation for the paper registry.",
        },
      ],
    },
  };
};

const writeJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [path, value] of Object.entries(buildSiteBundles())) {
    writeJson(path, value);
  }
  if (!existsSync("site")) mkdirSync("site", { recursive: true });
  console.log("updated site bundles:");
  for (const path of Object.keys(buildSiteBundles())) {
    console.log(`- ${join(process.cwd(), path)}`);
  }
}
