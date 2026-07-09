import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();

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
  const principles = sections.find((section) => section.title === "Principles");
  if (!principles) return [];
  const latex = read(principles.sourcePath);
  return [...latex.matchAll(/(KFD-[0-9]+)\s*&\s*([^\\]+)\\\\/g)].map((match) => ({
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
  const sections = sectionPaths().map(parseSection);
  const references = parseReferences();
  const principles = buildPrinciples(sections);
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
      suggestedPath: "/whitepaper",
      paperPath: "/whitepaper/kungfu-real-world-agent-work",
      pdfPath: "/whitepaper/kungfu-real-world-agent-work.pdf",
      evidenceUrl: "https://papers.libkungfu.dev/kungfu-product-white-paper",
    },
    hero: {
      title: buildchain.title,
      eyebrow: "Kungfu White Paper",
      lead: buildchain.abstract,
      stance: "Kungfu helps people and agents manage real-world work through non-drifting facts, fact-based trust, trusted value, and observer-declared timelines.",
      primaryCta: {
        label: "Read the white paper",
        href: "/whitepaper/kungfu-real-world-agent-work",
      },
      secondaryCta: {
        label: "Inspect evidence",
        href: "https://papers.libkungfu.dev/kungfu-product-white-paper",
      },
    },
    positioning: {
      audience: ["agent users", "developers", "operators", "researchers", "early product evaluators"],
      notOnly: ["LLM tracing", "debug dashboards", "IDE integration", "task management"],
      productClaim: "Kungfu is a local-first control plane and runtime fact layer for real-world work with agents.",
      philosophicalClaim: "Cooperation between humans and agents should start from trusted value, not hidden pressure.",
    },
    principles,
    homepageSections: [
      siteSection(sections.find((section) => section.title === "The Problem"), "first-screen", "problem-statement", 10),
      siteSection(sections.find((section) => section.title === "Product Thesis"), "primary", "product-thesis", 20),
      siteSection(sections.find((section) => section.title === "Principles"), "primary", "kfd-principles", 30),
      siteSection(sections.find((section) => section.title === "Roadmap"), "support", "roadmap", 40),
      siteSection(sections.find((section) => section.title === "Conclusion"), "support", "closing-thesis", 50),
    ].filter(Boolean),
    displayPlan: {
      firstScreen: ["hero", "The Problem"],
      primary: ["Product Thesis", "Principles"],
      support: ["Roadmap", "Conclusion"],
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
      suggestedPath: "/kungfu-product-white-paper",
      pdfPath: "/kungfu-product-white-paper/main.pdf",
      sourcePath: "/kungfu-product-white-paper/source.tar.gz",
      brandUrl: "https://kungfu.tech/whitepaper",
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
      commands: ["make check", "make pdf", "npx -y @kungfu-tech/buildchain@2.10.10 validate --cwd . --json", "npm pack --dry-run --json"],
      buildchainManifestPath: ".buildchain/publication/publication-artifact.json",
      sourceBundlePath: ".buildchain/publication/source.tar.gz",
      residualRisk: "The paper is a draft product white paper; philosophical and product-positioning claims still require human review before launch use.",
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
