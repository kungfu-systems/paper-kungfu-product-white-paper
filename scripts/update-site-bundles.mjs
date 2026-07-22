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
  .replace(/---/g, "—")
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

const agentSupplyChain = {
  contract: "kungfu-agent-supply-chain-public-narrative/v1",
  categoryStatement: "Kungfu is an open Agent Supply Chain protocol stack for discovering how Agent products cooperate, binding claims to exact software artifacts, establishing purpose-bound trust, preserving durable work facts, and carrying that work across independently owned Hubs.",
  claimBoundary: "Kungfu does not claim that a multi-Hub ecosystem already exists. It proves that Agent discovery, software provenance, trust, durable work state, and portability no longer need to be rebuilt or locked inside each Hub.",
  maturityVocabulary: ["proved-now", "enabled-by-protocol", "not-claimed"],
  layers: [
    {
      id: "kfd-3",
      order: 1,
      owner: "KFD",
      input: "Product-owned value, constraints, choices, commands, Exit, and record declarations",
      output: "A stable human-and-agent discovery surface for bounded cooperation",
      statement: "Discover how products cooperate through inspectable value, constraints, choices, commands, Exit, and records.",
      statusClass: "proved-now",
      evidenceCoordinates: [
        "npm:@kungfu-tech/kfd@1.0.0-alpha.41#README.md",
        "npm:@kungfu-tech/kfd@1.0.0-alpha.41#.buildchain/kfd-3/collaboration-interface.artifact.json",
      ],
      knownLimits: [
        "KFD-3 discovery is inspectable product guidance, not a hidden prompt or forced adoption mechanism.",
        "The current evidence proves the KFD alpha surface, not external vendor adoption or stable certification.",
      ],
      humanRoute: "https://kfd.libkungfu.dev/3",
      agentRoute: "https://kfd.libkungfu.dev/manifest.json",
    },
    {
      id: "buildchain",
      order: 2,
      owner: "Buildchain",
      input: "KFD-3-discoverable product declarations and an exact source cut",
      output: "Artifact-bound provenance, checks, and promotion evidence",
      statement: "Bind product-owned declarations to exact source, build, artifact, checks, and promotion evidence.",
      statusClass: "proved-now",
      evidenceCoordinates: [
        "npm:@kungfu-tech/buildchain@2.14.14-alpha.4#dist/site/product-mechanism.json",
        "npm:@kungfu-tech/buildchain@2.14.14-alpha.4#dist/site/release-provenance.json",
      ],
      knownLimits: [
        "Buildchain does not create product facts or make the receiver's trust decision.",
        "A passing Passport proves an exact release relation, not blanket certification, safety, or adoption.",
      ],
      humanRoute: "https://buildchain.libkungfu.dev/",
      agentRoute: "https://buildchain.libkungfu.dev/manifest.json",
    },
    {
      id: "kfd-2",
      order: 3,
      owner: "KFD and receiver",
      input: "Exact-artifact evidence, a declared purpose, and receiver policy",
      output: "A purpose-bound assessment with residual risk and decision ownership",
      statement: "Assess claims for a declared purpose while retaining residual risk and decision ownership.",
      statusClass: "proved-now",
      evidenceCoordinates: [
        "npm:@kungfu-tech/kfd@1.0.0-alpha.41#decisions/KFD-2.md",
        "npm:@kungfu-tech/kfd@1.0.0-alpha.41#.buildchain/kfd-2/public-release-trust.claim.json",
      ],
      knownLimits: [
        "KFD-2 is purpose-, cut-, and evidence-bound; it is not a company reputation score or universal trust certificate.",
        "A prior assessment does not authorize a changed artifact, purpose, receiver policy, or future release.",
      ],
      humanRoute: "https://kfd.libkungfu.dev/2",
      agentRoute: "https://kfd.libkungfu.dev/manifest.json",
    },
    {
      id: "libkungfu",
      order: 4,
      owner: "Kungfu and adopter",
      input: "Receiver-admitted work facts, commands, Episodes, and roots",
      output: "Ordered durable records, export, recovery, and qualification evidence",
      statement: "Preserve admitted work facts, Episodes, roots, export, and recovery evidence while applications own domain facts.",
      statusClass: "proved-now",
      evidenceCoordinates: [
        "git+https://github.com/kungfu-systems/kungfu.git#7eeb5bd1b45492f4da27eaacbe63eddfd6245176:docs/qualification/vendor-agent-hub-embedding.md",
        "git+https://github.com/kungfu-systems/kungfu.git#7eeb5bd1b45492f4da27eaacbe63eddfd6245176:examples/opencode-kungfu/qualification/run.mjs",
      ],
      knownLimits: [
        "Applications retain authority over domain facts; libkungfu owns admitted runtime records and ordering within its declared boundary.",
        "JSON is an edge projection, not a second authoritative data plane, and qualification remains platform- and cut-specific.",
      ],
      humanRoute: "https://libkungfu.dev/core/",
      agentRoute: "https://libkungfu.dev/core/manifest.json",
    },
    {
      id: "agent-hub-portability",
      order: 5,
      owner: "KFD profile and each Hub",
      input: "Bounded responsibility objects with rooted evidence and explicit authority",
      output: "Portable envelopes, conformance results, and receiver-owned admission decisions",
      statement: "Carry bounded responsibility objects across independently owned products with receiver-owned admission.",
      statusClass: "enabled-by-protocol",
      evidenceCoordinates: [
        "npm:@kungfu-tech/kfd@1.0.0-alpha.41#protocols/agent-hub/manifest.json",
        "npm:@kungfu-tech/kfd@1.0.0-alpha.41#protocols/agent-hub/README.md",
      ],
      knownLimits: [
        "The public profile enables independent implementations but does not prove a second independent production Hub.",
        "Portability preserves bounded roots, verdicts, conflicts, commitments, and digests; it does not promise lossless one-click migration.",
      ],
      humanRoute: "https://kfd.libkungfu.dev/protocols/agent-hub",
      agentRoute: "https://kfd.libkungfu.dev/manifest.json",
    },
  ],
  notClaimed: [
    "two independent production Hubs",
    "external vendor adoption or endorsement",
    "industry-standard status",
    "universal trust or blanket stable compatibility",
    "public Kungfu Cloud",
    "lossless one-click migration",
  ],
  vendorNextAction: "Assign a technical and product owner, run a bounded 30-day assessment, build one adapter or conformance spike, submit protocol gaps, then decide to adopt, co-shape, or monitor.",
};

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
      canonicalPath: "/whitepaper/kungfu-white-paper",
      canonicalUrl: "https://kungfu.tech/whitepaper/kungfu-white-paper",
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
        href: "https://kungfu.tech/whitepaper/kungfu-white-paper",
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
    agentSupplyChain,
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
      brandUrl: "https://kungfu.tech/whitepaper/kungfu-white-paper",
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
    agentSupplyChain,
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
