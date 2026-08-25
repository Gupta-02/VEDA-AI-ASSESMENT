# Validation notes

The revised desktop workspace was checked against the supplied reference screenshots. The initial upload state, populated PDF-card state, orange extraction transition, and split question-to-answer mapping state all render in the intended VedaAI visual language.

The tested flow uploaded two temporary in-browser PDF fixtures, enabled **Start Mapping**, presented **Extracting…**, and opened the dense question-answer mapping workspace. Selecting labelled sub-part **11 (a)** updated the corresponding green answer-sheet region and evidence label.

The no-login persistence path created a database-backed assessment for the browser’s locally retained owner key. After a full page refresh, **My Library** displayed the saved assessment and reopening it restored the mapping workspace. Selecting **11 (a)** persisted the active question and restored that selection on a later reopen. The teacher-review control was also invoked successfully and changed to **Saved** without authentication.

Real OCR, handwriting extraction, and uploaded file-byte storage remain future integrations; the current persistence layer saves document metadata, extracted question structures, answer regions, active question focus, and teacher review decisions.
