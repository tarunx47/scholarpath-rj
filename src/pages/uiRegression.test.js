// Regression tests for Dashboard rule chips, the Dashboard department fallback and the
// SchemeDetails eligibility section status. The real .jsx pages are bundled with esbuild into a
// temporary directory outside the repo, then rendered. Run with: node src/pages/uiRegression.test.js
import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log("PASS " + name);
  } else {
    failures += 1;
    console.log("FAIL " + name);
  }
}

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const PROVENANCE = {
  jurisdiction: "Rajasthan",
  issuing_authority: "test fixture",
  source_url: "https://example.test/fixture",
  source_page: "p1",
  source_date: "2026-01-01",
};

const currentRule = {
  id: "r-current",
  field: "state",
  op: "eq",
  value: "Rajasthan",
  label: "Current rule label",
  note: "",
  mandatory: true,
  informational: false,
  ...PROVENANCE,
  academic_year: "2026-27",
  verification_status: "verified-2026-27",
};

const nonCurrentRule = {
  id: "r-noncurrent",
  field: "category",
  op: "in",
  value: ["sc"],
  label: "Non-current rule label",
  note: "",
  mandatory: true,
  informational: false,
  ...PROVENANCE,
  academic_year: null,
  verification_status: "unverified",
};

const informationalRule = {
  id: "r-info",
  field: "gender",
  op: "eq",
  value: "female",
  label: "Informational rule label",
  note: "",
  mandatory: true,
  informational: true,
  ...PROVENANCE,
  academic_year: "2026-27",
  verification_status: "verified-2026-27",
};

const dashboardScheme = {
  id: "fixture-dashboard",
  name: "Fixture Dashboard Scheme",
  department: null,
  administering_authority: null,
  scheme_jurisdiction: null,
  official_url: null,
  identity_provenance: {
    source_url: null,
    source_page: null,
    source_date: null,
    academic_year: null,
    verification_status: "unverified",
    jurisdiction: null,
    issuing_authority: null,
  },
  eligibility_complete: false,
  eligibility_review: null,
  eligibility: [currentRule, nonCurrentRule, informationalRule],
  benefits: [],
  required_documents: [],
  application_steps: [],
  deadline: null,
  deadline_source: null,
  last_verified: null,
};

const workDir = mkdtempSync(join(tmpdir(), "sp-ui-regression-"));

try {
  const stubPath = join(workDir, "dataLoaderStub.js");
  writeFileSync(stubPath, "export function loadSchemes() { return " + JSON.stringify([dashboardScheme]) + "; }\n");

  const entry = [
    'import { createElement } from "react";',
    'import { renderToStaticMarkup } from "react-dom/server";',
    "import Dashboard from " + JSON.stringify(join(repoRoot, "src/pages/Dashboard.jsx")) + ";",
    "import { eligibilitySectionStatus } from " + JSON.stringify(join(repoRoot, "src/pages/SchemeDetails.jsx")) + ";",
    "export { createElement, renderToStaticMarkup, Dashboard, eligibilitySectionStatus };",
  ].join("\n");

  const bundlePath = join(workDir, "bundle.mjs");
  const built = await build({
    stdin: { contents: entry, resolveDir: repoRoot, loader: "js" },
    bundle: true,
    format: "esm",
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    platform: "node",
    write: false,
    outfile: bundlePath,
    jsx: "automatic",
    loader: { ".json": "json" },
    plugins: [
      {
        name: "fixture-data-loader",
        setup(b) {
          b.onResolve({ filter: /lib\/dataLoader\.js$/ }, () => ({ path: stubPath }));
        },
      },
    ],
  });
  writeFileSync(bundlePath, built.outputFiles[0].text);
  const ui = await import(pathToFileURL(bundlePath).href);

  // Dashboard reads the profile and saved/applied lists from sessionStorage.
  const store = {
    "scholarpath.profile": JSON.stringify({ state: "Rajasthan", gender: "male" }),
    "scholarpath.saved": "[]",
    "scholarpath.applied": "[]",
  };
  globalThis.sessionStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem() {},
    removeItem() {},
  };

  const html = ui.renderToStaticMarkup(
    ui.createElement(ui.Dashboard, { onOpenScheme() {}, onEditProfile() {}, onBack() {} }),
  );

  check(
    "dashboard: the current applicable rule appears exactly once as a chip",
    html.split("Met: Current rule label").length - 1 === 1,
  );
  check("dashboard: the non-current applicable rule is not shown as a chip", !html.includes("Non-current rule label"));
  check("dashboard: the informational rule is not shown", !html.includes("Informational rule label"));
  check(
    "dashboard: a null department shows Not yet available",
    html.includes('<p class="text-sm text-gray-600">Not yet available</p>'),
  );
  check("dashboard: no empty department paragraph is rendered", !html.includes('<p class="text-sm text-gray-600"></p>'));

  const section = ui.eligibilitySectionStatus;
  check(
    "section: all applicable rules current but eligibility_complete false is partial",
    section({ eligibility_complete: false, eligibility: [currentRule] }, { rules: [] }) === "partial",
  );
  check(
    "section: all applicable rules current and eligibility_complete true is verified",
    section({ eligibility_complete: true, eligibility: [currentRule] }, { rules: [] }) === "verified",
  );
  check(
    "section: no rules is empty",
    section({ eligibility_complete: true, eligibility: [] }, { rules: [] }) === "empty",
  );
  check(
    "section: informational-only rules count as empty",
    section({ eligibility_complete: true, eligibility: [informationalRule] }, { rules: [] }) === "empty",
  );
  check(
    "section: eligibility_complete true with a non-current applicable rule is not verified",
    section({ eligibility_complete: true, eligibility: [currentRule, nonCurrentRule] }, { rules: [] }) !== "verified",
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

if (failures > 0) {
  process.exitCode = 1;
}
