# ScholarPath

## Live Demo

https://scholarpath-rj.vercel.app/

**Your scholarship journey, made simpler.** Core promise: *From confusion to claim.*

ScholarPath is an independent, unofficial student guidance prototype for scholarship discovery and application guidance, aimed at college students in Rajasthan, India. It is built for the Codebenders ACE Builders Hackathon 2026 (Problem Statement 5).

> Unofficial guide, not affiliated with any government department. Final decision rests with the concerned department. ScholarPath does not process scholarship applications.

## What works today

- **Home**: intro, start button, and "Try as Rohit" / "Try as Aman" sample-profile buttons (synthetic profiles).
- **Student profile form**: collects only the facts needed for eligibility rules (state, category, income band, course, and scheme-specific facts). It does not collect Aadhaar, bank details, phone numbers or addresses. Profile data is held in the browser session only.
- **Dashboard**: scheme cards with Recommended / Saved / Applied tabs. Save and "Mark as applied" persist in browser storage.
- **Scholarship Details**: rules passed/failed, required documents, application steps, official link (when available), and last-verified date (or "Not yet available").
- **Deterministic eligibility engine** (`src/lib/eligibility.js`): plain JavaScript rules, no AI. Results are labelled Likely eligible, Possibly eligible (missing information), or Likely not eligible.
- **Verification logic** (`src/lib/verification.js`, `src/lib/checklist.js`): shows verification status per rule, document and step, and only treats an item as current when its status and academic year match.
- Footer on every screen with the unofficial-guide disclaimer.

## Not yet built

The PRD describes more than the current prototype delivers. These are **not** in the app yet and should not be presented as working:

- AI Assistant (no `api/` route or LLM call exists; the `api/` folder is empty).
- Standalone Application Tracker (manual status selection and status explanations from `statuses.json`).
- Partner View and the "For colleges and NGOs" section.
- Document mismatch guidance as a dedicated screen.

## Scheme data status

`src/data/schemes.json` contains three Rajasthan Social Justice and Empowerment Department post-matric scholarship entries (SC, ST, OBC). **All three are marked `unverified`** with `last_verified: null` and `official_url: null`. The app labels them "(Unverified)". No deadline is shown. Do not treat any rule, document or amount in this data as confirmed until it is checked against the official notice.

## Setup

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the built app locally
```

Unit-style checks are plain Node scripts (no test runner configured):

```bash
node src/lib/eligibility.test.js
node src/lib/verification.test.js
node src/lib/checklist.test.js
node src/data/schemes.test.js
node src/pages/uiRegression.test.js
```

End-to-end tests (Playwright, starts the dev server on port 5173 automatically):

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

### Environment variables

Copy `.env.example` to `.env.local` for local use. Never commit real keys.

| Variable | Used by | Status |
|---|---|---|
| `LLM_API_KEY` | Planned server-side AI Assistant only | Not used yet. No server route reads it. Keep it server-side; never put it in frontend code. |

The app currently runs fully without any environment variable.

## Project structure

- `src/App.jsx`: screen switching (Home, Profile, Dashboard, Scholarship Details)
- `src/pages/`: screen components
- `src/lib/`: eligibility engine, verification and checklist logic, data loader, profile options
- `src/data/`: `schemes.json`, `sampleProfiles.json`, `faqs.json`, `helplines.json`, `statuses.json`
- `e2e/`: Playwright tests
- `PRD.md`: product requirements

## Responsible AI and data limitations

- **The AI never decides eligibility.** Eligibility comes only from the deterministic rules engine.
- **No AI is currently live.** Core guidance is template-based and works without any LLM.
- **Unverified data.** Scheme entries are sample data and are labelled unverified. Official sources may conflict; always check the official notice.
- **Not an approval.** Eligibility results are guidance, not government approval.
- **Manual status only.** Statuses are entered by the student. ScholarPath does not access any government portal and does not fetch live status.
- **Synthetic profiles only.** The sample profiles "Rohit" and "Aman" are invented. No real student records are used.
- **No personal identifiers.** The app does not collect Aadhaar, bank, phone or exact address details.
- **Plain-language, general guidance** on mismatches and documents is marked as general. The official fix is confirmed with the college scholarship officer or the official helpdesk.
- **Session-only data.** Profile data is not stored on a server.

## Third-party components

- React 19 and React DOM (MIT)
- Vite 6 and `@vitejs/plugin-react` (build tooling)
- Tailwind CSS 4 and `@tailwindcss/vite` (styling)
- lucide-react (icons, ISC)
- Playwright Test (`@playwright/test`, end-to-end tests)
- esbuild (transitive build dependency)

No third-party logos, images or copy are used. The app currently uses the system font stack; Google Fonts are not loaded.

## Business model (assumptions to test)

ScholarPath is free for students. The following are hypotheses to validate, not facts:

- **Colleges**: fewer repeated student questions at the scholarship desk. Illustrative tier: a small annual subscription per institution (assumption to test).
- **NGOs and CSR programmes**: more eligible students reaching benefits, with impact reports. Illustrative tier: a larger annual subscription with impact reporting (assumption to test).
- **Student-support and coaching organisations**: possible partners (assumption to test).

Why switch from asking around: one place that says what applies, what to prepare, where to apply and what a status means, with official sources. All prices are illustrative and must be tested before use.

## Prompts used

- **Runtime LLM prompts:** none. No LLM call is implemented in this prototype. When the AI Assistant is built, its prompts must ground answers only in retrieved entries from the verified JSON data and fall back to templates when the API is unavailable.
- **Development prompts:** the build followed the milestone prompts in `PRD.md` section 9. Each milestone prompt was scoped to read `PRD.md` and the listed files, not refactor unrelated code, and not add features outside the milestone.

## Deployment

No deployment configuration is committed (no `vercel.json`, `netlify.toml` or CI workflow). Static build output is `dist/` from `npm run build`. If deploying to a static host, serve `dist/` and set no secrets. Add `LLM_API_KEY` in the host's server-side environment only when the AI Assistant is implemented.
