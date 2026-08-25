# Veda AI — Assessment Extraction & Answer Mapping

Veda AI is a teacher-facing assessment workspace for reviewing a question paper alongside a student’s handwritten answer sheet. It follows the supplied VedaAI interaction direction: two-document intake, an extraction transition, a dense question mapping panel, and precise evidence highlights on the answer sheet.

The central review question is simple: **which question was answered, where is that answer on the paper, and what needs the teacher’s attention?**

## Assignment coverage

| Assignment requirement | Implementation status |
| --- | --- |
| Upload a question paper and an answer sheet | Implemented with PDF/image input controls and a 10 MB validation guard. |
| Show a processing state | Implemented through the intermediate **Extracting…** view. |
| Preserve question order and labelled sub-parts | Demonstrated with ordered questions, including `11 (a)` and `11 (b)`. |
| Map questions to answer-sheet regions | Implemented with question selection and exact green evidence rectangles. |
| Support unanswered and uncertain mappings | Demonstrated through explicit **Unanswered** and **Unmatched** states. |
| Support answers out of order and multiple pages | Demonstrated in the question data and page selector context. |
| Persist assessment data | Implemented with MySQL/TiDB via Drizzle and an opaque browser owner key; no sign-in is needed for the prototype. |

> **Scope note:** The current version is a production-style interactive prototype. Question extraction, handwriting OCR, and uploaded document-byte storage are represented by structured demonstration data rather than a live vision/OCR pipeline. The database persists the document metadata, extracted question records, answer regions, selected question, and teacher review decisions.

## Product flow

```text
Upload question paper + answer sheet
            ↓
Extracting state
            ↓
Ordered questions + mapped answer regions
            ↓
Teacher review and score decision
            ↓
Saved assessment available in My Library
```

## Key features

The workspace has four designed states: an initial upload screen, an uploaded-file state with removable PDF cards, an extraction/loading state, and a detailed mapping workspace. The mapping view focuses the selected question and moves the exact green answer-region highlight to the relevant location on the handwritten sheet.

The prototype includes explicit edge cases a teacher needs to assess confidently. These include labelled sub-parts, answers that appear out of printed order, no detected answer, uncertain/unmatched calculation work, and answer records associated with later pages.

## Architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Client | React 19, TypeScript, Tailwind CSS | Figma-aligned views, file-selection states, mapping interaction, responsive UI. |
| API | Express + tRPC | Typed assessment create, list, load, focus, and review-save procedures. |
| Database | MySQL/TiDB + Drizzle ORM | Durable assessment sessions, extracted questions, exact answer rectangles, and review-event history. |
| Ownership | Browser-generated opaque owner key | Keeps prototype records scoped to the same browser without requiring authentication. |
| Optional identity | OAuth-ready design | A user identity layer can be added later without changing assessment ownership records. |

The database model is intentionally normalized. `assessmentSessions` holds source-document metadata and current review focus; `assessmentQuestions` stores extracted questions in original order; `answerRegions` stores exact page-relative rectangles; and `assessmentReviewEvents` stores append-only teacher decisions.

## Local setup

### Prerequisites

Use Node.js 22+ and pnpm. Add `DATABASE_URL` in your deployment environment before enabling persistence. Do not commit a `.env` file.

### Install and run

```bash
pnpm install
pnpm drizzle-kit migrate
pnpm dev
```

Open the locally served application URL displayed by the development server.

### Quality checks

```bash
pnpm check
pnpm test
pnpm build
```

The current test suite validates assessment payload rules, including labelled question sub-parts and valid answer-region bounds, alongside the existing authentication logout behavior.

## Database workflow

When the Drizzle schema changes, generate and apply a migration:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

File bytes should not be stored in database columns. To add real document persistence, upload the file to object storage, then store its object key, URL, file name, and MIME metadata in `assessmentSessions`.

## Deploy to Vercel

The repository includes `vercel.json` and a serverless API entrypoint at `api/[...path].ts`. Import the GitHub repository into Vercel, then set `DATABASE_URL` in the Vercel project environment if saved assessment history is required. The included [deployment guide](./DEPLOYMENT.md) documents the expected build settings and production verification steps.

## Manual test script

| Step | Expected result |
| --- | --- |
| Open **Exams**. | The initial upload screen shows two required inputs and a disabled mapping action. |
| Select a valid question paper and answer sheet under 10 MB. | Both cards change to PDF metadata cards, each with a remove control; **Start Mapping** enables. |
| Select **Start Mapping**. | The extraction state is displayed before the mapping workspace opens. |
| Select `11 (a)`, `12`, or `15`. | The answer region changes, a partial-review state is shown for `12`, and a no-answer state is shown for `15`. |
| Select **Save teacher review**. | The button updates to **Saved**. |
| Refresh, open **My Library**, then reopen the saved assessment. | The saved record remains visible; the mapping workspace and last selected question are restored. |

## Submission information

| Item | Status |
| --- | --- |
| Deployed production URL | **Pending deployment.** Deploy the repository to Vercel, then paste the resulting URL here and into the submission form. |
| GitHub repository | Create the repository and add its repository URL here. |
| AI model/API | No external model is currently invoked. The UI demonstrates the extracted/mapped outcome using structured prototype data. |
| Key limitation | Live OCR, handwriting recognition, and image/PDF extraction have not been integrated. |

## Next implementation steps

1. Add a server-side document upload endpoint backed by object storage.
2. Integrate an OCR/vision service that returns ordered question blocks and answer-page bounding rectangles.
3. Allow teachers to edit suggested scores, add comments, and export a reviewed assessment.

---

Built as a VedaAI hiring-assignment submission prototype.
