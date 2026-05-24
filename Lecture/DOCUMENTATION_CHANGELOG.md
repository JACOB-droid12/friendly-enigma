# Documentation Changelog

Target document: `Documentation.docx`  
PDF export: `Documentation_Final.pdf`  
Project: Basketball Court Scheduling System for Barangay Sto. Niño, Parañaque City

## Sections Added

- Created a formal ASL-style title page for Adamson University, College of Science, Computer Science Department, Academic Service Learning, and the Basketball Court Scheduling System.
- Replaced the acknowledgement placeholder with a polished acknowledgement using only verified/instruction-provided names and placeholders where names were unavailable.
- Added an updateable Word table of contents using heading styles.
- Added Chapter 1: Introduction, including background, barangay history placeholder, mission/goal/vision placeholders, organizational structure placeholder, statement of the problem, objectives, scope, and limitations.
- Added Chapter 2: Database & Program Structure, including generated flowcharts, schema-based ER notation, a regenerated current ERD, and UI screenshots with captions.
- Added Chapter 3: The Forms, including ASL plan of activities and placeholder forms for dean/faculty/class/student/community evaluation and turnover.
- Added Chapter 4: Reflection, with one placeholder/prompt section per group member.
- Added Chapter 5: Documentation, with placeholder photo sections for barangay hall, visits, data gathering, contract/approval, development, testing, presentation, deployment, and training.

## Source Files Used

- `C:\Users\Emmy Lou\Documents\New project 3\Lecture\GROUP-8-ASL-2024-FINAL-DOCUMENTATION-1.pdf` as structural and formatting reference only.
- `C:\Users\Emmy Lou\Documents\New project 3\Lecture\Documentation.docx` as the target file.
- `C:\Users\Emmy Lou\Downloads\Project Proposal.pdf` for project background, objectives, offline setup, beneficiaries, scope, and limitations.
- `C:\Users\Emmy Lou\Downloads\Presentation Slides.pptx` for data requirements, account creation, deployment, MySQL storage, and feature modules.
- `C:\Users\Emmy Lou\Downloads\Database Diagram.jpg` as the proposal database diagram reference.
- `C:\Users\Emmy Lou\Documents\New project\package.json` for actual stack and verification scripts.
- `C:\Users\Emmy Lou\Documents\New project\README.md` for system overview, offline deployment, and implemented feature summary.
- `C:\Users\Emmy Lou\Documents\New project\docs\ARCHITECTURE.md` for offline office workflow, stack decision, and ISO/IEC 25010 readiness notes.
- `C:\Users\Emmy Lou\Documents\New project\docs\REFERENCE_REVIEW.md` for proposal, slides, UI draft, and diagram review.
- `C:\Users\Emmy Lou\Documents\New project\docs\IMPLEMENTATION_VERIFICATION_REPORT.md` for implemented feature evidence and proposal-to-code comparison.
- `C:\Users\Emmy Lou\Documents\New project\docs\ISO_25010_EVALUATION.md` for ISO/IEC 25010 evidence mapping without invented scores.
- `C:\Users\Emmy Lou\Documents\New project\docs\DEPLOYMENT_GUIDE.md` and `docs\POST_DEPLOYMENT_API_CONTRACT.md` for deployment and API behavior.
- `C:\Users\Emmy Lou\Documents\New project\database\schema.sql`, `seed.sql`, and `database\README.md` for current MySQL/MariaDB schema facts.
- `C:\Users\Emmy Lou\Documents\New project\src\features\`, `client\src\`, `maintenance-tools\`, `scripts\`, and `tests\` for implemented route, UI, maintenance, and test evidence.
- Existing UI screenshots under `C:\Users\Emmy Lou\Documents\New project\tmp\visual-evidence\` and `tmp\codex-zero-tolerance-ui-audit\`.

## Generated/Inserted Visuals

- Generated flowcharts for login, dashboard/navigation, reservation creation, schedule monitoring, account management, activity logs, and backup/maintenance tooling.
- Regenerated the ERD from the current `database/schema.sql` implementation because the provided `Database Diagram.jpg` was a proposal/reference diagram and did not include all current tables.
- Inserted actual UI screenshots for login, dashboard, calendar/schedule, reservation form, reservation details, reservation records, account management, activity logs, reports, and maintenance block modal.

## Placeholders Still Present

- Course/subject, section, professor/ASL instructor, semester, school year, and date of submission.
- Verified history of Barangay Sto. Niño, Parañaque City.
- Verified barangay mission, goal, and vision.
- Barangay organizational structure and official list.
- Completed/signed ASL forms.
- Student numbers, private contact details, addresses, class schedules, and other personal registration data.
- Personal reflections from the six group members.
- Barangay visit, data gathering, signing, development, testing, presentation, deployment, turnover, and user-training photos.
- Screenshot of the Windows maintenance tools launcher for backup/restore.
- Completed evaluation scores or survey results.

## Information Unavailable

- No verified barangay history, mission, goal, vision, official names, or organizational chart were found in the inspected source files.
- No verified professor/adviser name, course, section, semester, school year, or submission date were found.
- No completed signed ASL forms, student personal data, personal reflections, visit photos, acceptance form, or community evaluation results were found.
- No actual target barangay office PC sign-off, physical printer output, or final on-site turnover result was available in the source files.
- No in-app backup/restore screen was found; backup and restore are implemented through Windows maintenance scripts.

## Verification Commands Run

- `npm test` - FAILED. Result: 468 passed, 1 failed. Failing test: `Property 1 — each day card renders exactly one .staff-day-head-num` in `tests\reactCalendarWeekDayNumber.test.js:28`; assertion said `expected exactly one card with the · TODAY suffix`, actual `0`, expected `1`.
- `npm run frontend:build` - PASSED. Vite production build completed. Font path warnings were emitted for local `/app/fonts/...` files remaining runtime-resolved.
- `npm run verify:react-build` - PASSED. React build was present and contained no remote asset references.
- `npm run verify:sql` - PASSED. SQL static verifier confirmed required schema, charset, tables, triggers, seed data, diagnostics, and setup coverage.
- `npm run verify:ui` - PASSED. UI smoke verification passed for 22 office screens.
- `npm run verify:offline-runtime` - PASSED. Offline runtime verification passed at a temporary localhost URL.
- Microsoft Word COM field update and PDF export - PASSED. `Documentation_Final.pdf` was generated from the completed DOCX.
- `render_docx.py` visual render workflow - FAILED because LibreOffice/`soffice` was not installed or not on PATH (`FileNotFoundError: [WinError 2]`).
- PDF structural check with `pypdf` - PASSED. The generated PDF has 55 pages and includes all five required chapters.
- Chrome PDF viewer spot check - PASSED for the updated table of contents and generated diagram pages.

## Commands Not Run

- `npm run build` - NOT RUN because no `build` script exists in `package.json`.
- `npm run lint` - NOT RUN because no `lint` script exists in `package.json`.
- `npm run verify:mysql` - NOT RUN during this documentation pass because it requires live local MySQL verification and writes temporary verification data.
- Physical target-PC and printer checks - NOT RUN from this environment.

## Git Commit Status

- Committed: yes.
- Commit note: only `Lecture/Documentation.docx`, `Lecture/Documentation_Final.pdf`, and `Lecture/DOCUMENTATION_CHANGELOG.md` were committed for this documentation task. Other pre-existing staged/unstaged files were left untouched.
