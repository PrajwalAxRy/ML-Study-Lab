# ML Study Lab

A local, dependency-free study app generated from `ML_INTERVIEW_QNA.md`.

## Run locally

```powershell
npm start
```

Open [http://localhost:4173](http://localhost:4173).

No package installation or internet connection is required. Node.js 18 or newer is sufficient.

## Learning features

- Active-recall sessions with hidden answers
- Honest self-rating: Again, Got it, and Easy
- Spaced-review scheduling and topic mastery
- XP, levels, recall combos, daily goals, active-day history, and badges
- Ten-question mixed challenges
- Search and filters across all 444 questions
- Mark questions done from the question screen or lists to record Easy recall and update mastery, XP, and review scheduling; click Done to undo completion
- Topic-by-topic study trail in foundations-first order
- Saved questions and personal notes
- Keyboard shortcuts and reduced-motion support
- Browser and server-side progress persistence across devices
- JSON export/import and reset controls
- Learning room: three module cards, each opening its own lesson path and three hypothetical worked cases
- Search & Learning to Rank: 12 lessons; Recommendation Fundamentals: 10 lessons; ML in Production: 15 lessons
- Explanation drafts, expandable worked answers, retryable checkpoints, and interactive ranking-metrics and content-based recommendation exercises
- Course completion, checkpoint results, and drafts saved alongside existing progress, with separate course milestones

Open the module hub at [http://localhost:4173/#learn](http://localhost:4173/#learn). Open [Search](http://localhost:4173/#learn/search), [Recommendations](http://localhost:4173/#learn/recommendations), or [ML in Production](http://localhost:4173/#learn/production) directly. Each module retains its own completion, checkpoints, and last-opened lesson. Existing Search unit identifiers and old lesson links are preserved. Reading a unit does not change question-bank mastery or XP. Lesson completion can be toggled from its module list without opening it.

The worked cases cover building search end to end, improving tail queries with sparse labels, and investigating offline gains that regress online. All case designs and example numbers are hypothetical. Optional links to primary references are included, but the lessons themselves work without internet access.

The Recommendation module covers feedback and baselines, content-based and collaborative filtering, matrix factorization, implicit ALS and BPR, candidate generation and two towers, hybrid ranking, cold start, evaluation, and technical reasoning. Its cases cover an app discovery shelf, new-app cold start, and a tap-through improvement without better useful discovery. Advanced sequence models, bandits, page optimization, uplift, and evidence/messaging personalization remain future deep dives.

The interface uses neutral learning language for everyday study. The original source-bank filename, storage key, and saved unit IDs remain unchanged for progress compatibility. Older playbook links redirect to the neutral `#learn/search/search-playbook` route.

ML in Production covers ingestion contracts, batch/stream processing, duplicates and replay, database roles, data modeling, offline/online features, reproducible training, serving patterns, capacity and latency, deployment, monitoring, recovery, privacy, and cost. It includes a storage comparison table, illustrative JSON/SQL, a pipeline-stage explorer, and a partition-aware capacity calculator. Worked cases cover app discovery, daily batch forecasts, and recovery from duplicate events and stale features. Examples do not provision infrastructure or execute the displayed code.

## Verification

Run `npm test` for content, legacy progress compatibility, merge behavior, ranking-metric calculations, and question-bank regression checks. Optional isolated browser checks are in `tests/learning-browser.cjs`; they require Playwright and Microsoft Edge and intercept all progress requests in memory, leaving your real `progress.json` untouched. Set `PLAYWRIGHT_MODULE_DIR` to a package directory containing Playwright if it is not installed locally.

## Keyboard shortcuts during practice

| Key | Action |
| --- | --- |
| `Space` | Reveal answer |
| `1` | Rate Again |
| `2` | Rate Got it |
| `3` | Rate Easy |
| `S` | Save or unsave the question |
| `Right Arrow` | Skip to the next question |

## Project files

- `index.html`: semantic application shell
- `styles.css`: responsive visual system
- `app.js`: guide parser, learning engine, persistence, and interactions
- `search-course.js`: self-contained course content and primary-source references
- `recommendation-course.js`: recommendation lessons, cases, glossary, and primary-source references
- `production-course.js`: production systems lessons, cases, examples, glossary, and primary-source references
- `server.js`: minimal localhost server
- `progress.json`: automatically created private study progress (ignored by Git)
- `ML_INTERVIEW_QNA.md`: source question bank
- `PRODUCT.md`: product and accessibility principles
