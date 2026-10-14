# ML Study Lab

ML Study Lab is a small, local study app for reviewing machine-learning fundamentals and practicing applied system design. It turns a Markdown question bank into short recall sessions and adds three guided courses with lessons, exercises, and hypothetical case studies.

The app has no account, build step, external service, or required package install. Your study data stays in your browser and, when the local server is running, in a private file on your computer.

## Start studying

### Requirements

- Node.js 18 or newer
- npm, which is included with Node.js

### Run

From the project folder, start the local server:

```sh
npm start
```

Then open [http://localhost:4173](http://localhost:4173). Stop the server with `Ctrl+C` in the terminal.

No `npm install` step is needed. To use another port, set `PORT` before starting the server. For example, in PowerShell:

```powershell
$env:PORT = '5000'
npm start
```

Then visit `http://localhost:5000`.

## What you can do

### Review the question bank

The app includes **444 questions across 28 topics**. Start a quick practice session, choose a topic from the skill trail, search and filter the library, or save questions for later. In practice, try to answer before revealing the explanation, then rate your recall:

- **Again** schedules an earlier review.
- **Got it** records a successful recall.
- **Easy** records strong recall.

Ratings update topic mastery and review timing. The app also tracks XP, daily activity, goals, challenge runs, and badges. Marking a question done in a list records an Easy recall; you can undo it.

During a practice session, use `Space` to reveal an answer, `1` / `2` / `3` to rate it, `S` to save or unsave it, and `→` to move on.

### Follow a course

Choose **Learning room** for three self-contained courses. Each has lessons in study order, checkpoints, a place to draft your explanation, and three hypothetical worked cases. Lessons can be marked read or unread; reading them does not change question-bank mastery or XP.

| Course | Lessons | Worked cases | Topics include |
| --- | ---: | ---: | --- |
| Search & Learning to Rank | 12 | 3 | Retrieval, ranking, relevance data, metrics, experimentation, and search design |
| Recommendation Fundamentals | 10 | 3 | Feedback, content and collaborative methods, matrix factorization, candidate generation, evaluation, and cold start |
| ML in Production | 15 | 3 | Data ingestion, processing, storage, features, training, serving, operations, privacy, and cost |

The cases and example numbers are hypothetical. Some lessons link to optional primary-source reading; the course content itself works offline.

## Your data

The app saves progress in browser `localStorage`. While using the local server, it also saves progress to `progress.json` beside the app files. That file is excluded from Git. The app does not send data to a hosted service. Use **Export progress** to make a JSON backup, **Import progress** to restore one, or **Reset progress** to erase saved study data.

By default, the server listens only on your computer at `127.0.0.1`. If you deliberately want to use it from another device on your local network, set `HOST=0.0.0.0` before starting it and open the server computer's network address on that device. For example, in PowerShell:

```powershell
$env:HOST = '0.0.0.0'
npm start
```

LAN mode has no login or access control: anyone who can reach the server can read or overwrite its saved progress. Use it only on a trusted network, and do not expose it to the public internet.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | App shell and page metadata |
| `styles.css` | Layout, responsive styling, and accessibility states |
| `app.js` | Question parsing, practice, courses, progress, and interactions |
| `ML_INTERVIEW_QNA.md` | Source question bank loaded by the app |
| `search-course.js` | Search lessons, cases, and references |
| `recommendation-course.js` | Recommendation lessons, cases, and references |
| `production-course.js` | Production lessons, cases, examples, and references |
| `server.js` | Local web server and progress-file endpoint |
| `tests/learning.test.cjs` | Fast content and learning-logic tests |
| `tests/learning-browser.cjs` | Optional end-to-end browser checks |
| `PRODUCT.md` | Product, audience, and accessibility principles |

## Tests

Run the dependency-free test suite with:

```sh
npm test
```

The optional browser suite runs with `npm run test:browser`. It requires Playwright and Microsoft Edge. The suite intercepts progress requests in memory and writes screenshots under the ignored `test-artifacts/` folder, so it does not touch your real `progress.json`. If Playwright is installed outside this project, set `PLAYWRIGHT_MODULE_DIR` to the directory containing its package before running the command.

## Limitations

- Progress is local to the browser and server you use; there are no accounts or hosted sync.
- The LAN option is intended for a trusted home or office network, not public hosting.
- The app is a learning aid, not a certification or a substitute for checking current primary sources.
- The repository does not yet include a license. A license choice is needed before granting reuse rights for a public release.
