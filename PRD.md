# ScholarPath: Product Requirements Document (PRD)

**Version:** 1.1
**Project:** Codebenders ACE Builders Hackathon 2026 (Problem Statement 5)
**Product:** Scholarship discovery and application guidance platform
**Target users:** College students in Rajasthan, India
**Tagline:** Your scholarship journey, made simpler.
**Core promise:** From confusion to claim.

ScholarPath is an independent student guidance platform. It is not affiliated with any government department and does not process scholarship applications.

## 1. Problem

Students struggle with more than finding scholarships. They struggle to understand eligibility, identify required documents, navigate portals, resolve document mismatches (for example a name spelled differently across records), interpret application statuses (pending, defective, verified, sanctioned), and know who to contact. Information exists on official sites, but it is hard to turn into clear next steps.

## 2. Users and journeys

**User A, first-time applicant (sample: "Rohit", 19).** Undergraduate in Rajasthan, low-income family, has never applied. Needs: discover relevant schemes, understand eligibility, see missing information, get a document checklist, know where and how to apply. Success: finds a likely-suitable scheme and knows the next steps.

**User B, existing applicant (sample: "Aman", 21).** Already applied, sees a status or objection he does not understand. Needs: understand what the status means, the next action, and the correct official helpdesk. Success: knows what to do next and whom to contact.

Both are synthetic sample profiles. Offer one-click buttons on the Home screen: "Try as Rohit" and "Try as Aman".

## 3. MVP features

**A. Student profile.** Collect only: state, social category (where relevant), annual family income band, course and education level, institution type (where relevant), other scheme-specific eligibility facts. Never collect Aadhaar numbers, bank details, phone numbers or exact addresses. Keep the profile in browser memory or session only.

**B. Scholarship discovery.**
- Curated list of schemes from `schemes.json`.
- Deterministic JavaScript rules engine decides matches. The AI never decides eligibility.
- Result labels: Likely eligible, Possibly eligible (missing information), Likely not eligible. Never show fabricated match percentages. Never say "guaranteed".
- Each result shows the rules it passed or failed (for example "Income is below the limit", "Needs: category certificate"), the official source link, and the last-verified date.
- Jobright-style layout is acceptable: scheme cards, match chips, tabs (Recommended / Saved / Applied). Use no third-party logos, copy or images.

**C. Document checklist.** Per-scheme required documents; the student can tick items as ready. Include plain-language guidance for common mismatches (for example name differences across records), clearly marked as general guidance: "Confirm the exact fix with your college scholarship officer or the official helpdesk." Distinguish confirmed requirements from general guidance.

**D. Application guidance.** Ordered steps, official portal link, and the owning department's helpdesk. Show a deadline only if it has a source and verification date. Otherwise show "Check the official notice".

**E. Application tracker (manual).** The student selects their status from a list. The app shows a plain-language explanation and next steps from `statuses.json`. Include the "why is my sanctioned amount different from my fee?" explanation: general reasons only (for example the scheme may set its own amount or cap), never a diagnosis of one student's case. Never imply live portal access.

**F. AI assistant.** Two jobs only:
1. Turn a plain-language description into structured profile facts (state, category, income band, course). Ask a follow-up if something is missing.
2. Explain eligibility results, documents, steps and statuses using only retrieved entries from the verified JSON data.

Rules: never invent deadlines, rules, documents, helpline numbers or procedures. If the data does not cover it, reply: "I don't have verified information on this. Please check the official source," with the link. Never promise approval or payment.

**Fallback (required):** All core guidance must work with no LLM, using JSON templates, FAQs and status explanations. The LLM only improves wording and handles free-text questions. If the API fails, show template answers without error noise.

**G. Partner view (business viability).** A simple page using clearly labelled illustrative sample data: students guided, applications by stage (preparing / submitted / pending verification / defective / sanctioned), most common stuck points (document mismatch, unclear status, missed deadline), and a "benefit value unlocked" figure marked as an estimate. Banner: "Sample data for demonstration."

## 4. Business model

- The student pays nothing.
- Payers (hypotheses to validate, not facts): colleges (fewer repeated student queries at the scholarship desk), NGOs and CSR programmes (more eligible students reaching benefits, with impact reports), and student-support or coaching organisations.
- Illustrative pricing for the pitch: a per-institution annual subscription (for example a small tier for colleges and a larger tier for NGOs or CSR with impact reporting). Label all prices "assumption to test".
- Why switch from asking around: one place that says what applies to you, what to prepare, where to apply, and what a status means, with official sources.
- Show this on a short "For colleges and NGOs" section or page in the app and repeat it in the README.

## 5. Screens

1. Home: intro, start button, sample-profile buttons.
2. Student Profile: short form.
3. Dashboard: recommended schemes, saved and applied tabs, closing-soon flags only where the deadline is verified.
4. Scholarship Details: match reasons, documents, steps, official links, helpdesk, last-verified date.
5. Application Tracker: manual status, explanation, next steps.
6. AI Assistant: grounded chat.
7. Partner View: sample-data dashboard plus business model summary.

Mobile-first, responsive, simple. Footer on every page: "Unofficial guide, not affiliated with any government department. Final decision rests with the concerned department."

## 6. Technical approach

- Frontend: React + Vite, Tailwind CSS. Lucide icons and Google Fonts only.
- Data: local JSON (`schemes.json`, `statuses.json`, `faqs.json`, `helplines.json`).
- Eligibility: deterministic JS module, no AI.
- AI: LLM API, subject to Codebenders and hackathon rules (confirm whether a built-in model exists and whether external APIs are allowed). The API key stays server-side in an environment variable via a small server route or serverless function. Never put it in frontend code or the repo. Provide a `.env.example` only.
- Scheme record fields: `id`, `name`, `department`, `description`, `eligibility` (structured rules), `required_documents`, `application_steps`, `official_url`, `helpline_id`, `deadline`, `deadline_source`, `last_verified`, `verification_status` (verified / unverified-sample).
- Helplines and portal URLs live in editable data with last-verified dates. Never hardcode them in components.

## 7. Data accuracy and responsible AI

- Primary sources: official government sites, guidelines and notices. Write all rules and descriptions in our own words. Do not paste portal text.
- Store source link and verification date for every scheme, helpline and deadline.
- Mark any unverified entry visibly as "Sample, unverified".
- Do not hardcode uncertain deadlines. Official sources may conflict, so always point to the official notice.
- Eligibility guidance is not government approval.
- Manually entered statuses are not live portal data.
- Synthetic profiles only. No real student records.

## 8. Do not build

Authentication or accounts, Aadhaar or bank verification, government portal integration, automatic status fetching, automatic form submission, payments, complex admin tools, mobile apps, voice input, large recommendation systems, unverified or invented scheme data.

## 9. Milestones (one per new Nexen chat; commit after each)

1. Project setup, folder structure, JSON data loader, sample `schemes.json`.
2. Student profile form, sample-profile buttons, deterministic eligibility engine.
3. Dashboard and Scholarship Details with match reasons and sources.
4. Document checklist, application steps, status tracker.
5. Partner view and "For colleges and NGOs" business section (sample data).
6. AI assistant with verified-data grounding and no-AI fallback.
7. Polish, responsive check, deploy, README (Responsible AI, third-party components, business model, prompts used), demo flow.

Each milestone prompt should say: read only PRD.md and the listed files, do not refactor unrelated code, do not add features outside the milestone.

## 10. Success criteria

1. A student enters a profile and gets explainable recommendations.
2. A student sees documents and application steps for a scheme.
3. An existing applicant selects a status and sees the next action and the right helpdesk.
4. The AI assistant answers from verified data only.
5. Core guidance works with the AI unavailable.
6. Official sources and last-verified dates are visible.
7. The partner view and business model are visible in the app.
8. The demo shows the flow: profile, recommendations, checklist, apply steps, status tracking, partner view.