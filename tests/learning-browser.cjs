/* Isolated browser checks: every /api/progress request is intercepted in memory.
   This script never reads or writes the learner's progress.json. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const runtimePackages = process.env.PLAYWRIGHT_MODULE_DIR;
const { chromium } = require(runtimePackages ? path.join(runtimePackages, 'playwright') : 'playwright');
const root = path.resolve(__dirname, '..');
const port = 4175;
const url = `http://127.0.0.1:${port}`;
const storageKey = 'ml-interview-gym-v2';
const server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, windowsHide: true });
const initialReview = { mastery: 3, attempts: 2, wins: 2, dueAt: Date.now() + 10000000, completed: true, updatedAt: 100 };
let saved = { version: 1, xp: 240, reviews: { 't1-q1': initialReview }, notes: { 't1-q1': 'Existing note' }, updatedAt: 100 };
let browser;
const errors = [];

async function context(options = {}) {
  const ctx = await browser.newContext(options);
  await ctx.route('**/api/progress', async (route) => {
    if (route.request().method() === 'PUT') {
      saved = JSON.parse(route.request().postData());
      await route.fulfill({ json: { saved: true, savedAt: new Date().toISOString() } });
    } else await route.fulfill({ json: saved });
  });
  return ctx;
}

async function waitSaved(page) {
  await page.waitForFunction(() => document.querySelector('.sync-indicator.is-saved'));
}

async function main() {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (chunk) => { if (chunk.toString().includes('is running')) resolve(); });
    server.on('error', reject);
    server.on('exit', (code) => reject(new Error(`Test server exited: ${code}`)));
  });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const desktop = await context({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  assert.equal(await page.title(), 'ML Study Lab');
  assert.doesNotMatch(await page.locator('body').innerText(), /interview/i);
  await page.getByRole('button', { name: 'Enter learning room' }).click();
  assert.equal(await page.locator('.module-card').count(), 3);
  assert.equal(await page.locator('.course-row').count(), 0);
  await page.getByRole('button', { name: 'Open Search & Learning to Rank', exact: true }).click();
  await page.getByRole('heading', { name: '12 lessons, in study order' }).waitFor();
  assert.equal(await page.locator('.course-row').count(), 15);
  await page.locator('[data-action="learn-done"][data-unit="search-framing"]').click();
  await waitSaved(page);
  assert.equal(saved.learning.entries['search-framing'].completed, true);
  assert.equal(saved.xp, 240);
  assert.deepEqual(saved.reviews['t1-q1'], initialReview);

  await page.locator('.course-row [data-action="learn-unit"][data-unit="search-framing"]').click();
  const draft = 'My hypothesis: preserve title matches. <script>window.courseXss = true</script>';
  await page.locator('#learning-draft').fill(draft);
  await page.locator('[data-action="learn-check"][data-choice="0"]').click();
  assert.match(await page.locator('.checkpoint-feedback').innerText(), /Not quite/);
  await page.locator('[data-action="learn-check"][data-choice="1"]').click();
  assert.match(await page.locator('.checkpoint-feedback').innerText(), /Checkpoint cleared/);
  await page.getByText('Compare with a worked answer', { exact: true }).click();
  assert.equal(await page.locator('.interview-model').getAttribute('open'), '');
  await waitSaved(page);
  await page.reload();
  await page.locator('#learning-draft').waitFor();
  assert.equal(await page.locator('#learning-draft').inputValue(), draft);
  assert.equal(await page.evaluate(() => window.courseXss), undefined);
  assert.match(await page.locator('.checkpoint-feedback').innerText(), /Checkpoint cleared/);
  assert.equal(saved.learning.entries['search-framing'].attempts, 2);
  await page.locator('.lesson-outline a').first().click();
  assert.equal(new URL(page.url()).hash, '#learn/search/search-framing');
  await page.getByRole('heading', { name: 'Think in queries, candidates, and ordered lists' }).waitFor();

  await page.locator('#learning-unit-picker').selectOption('ranking-metrics');
  await page.locator('#ranking-lab').waitFor();
  const before = await page.locator('.rank-metrics dd').first().innerText();
  await page.getByRole('button', { name: 'Move Trail Atlas up' }).click();
  assert.notEqual(await page.locator('.rank-metrics dd').first().innerText(), before);
  assert.equal(await page.locator('.rank-items strong').first().innerText(), 'Trail Atlas');
  // Keyboard activation is equivalent to pointer activation.
  await page.locator('[data-action="learn-check"][data-choice="0"]').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('.checkpoint-feedback').innerText(), /Checkpoint cleared/);

  // Every unit renders all content and a valid checkpoint.
  for (const id of await page.locator('#learning-unit-picker option').evaluateAll((items) => items.map((item) => item.value))) {
    await page.locator('#learning-unit-picker').selectOption(id);
    assert.equal(await page.locator('.lesson-prose > section').count() >= 3, true, id);
    assert.equal(await page.locator('.checkpoint-option').count(), 3, id);
    assert.doesNotMatch(await page.locator('body').innerText(), /interview/i, id);
    await page.locator('.interview-model summary').click();
    assert.doesNotMatch(await page.locator('body').innerText(), /interview/i, `${id} worked answer`);
    if (id === 'interview-playbook') assert.equal(new URL(page.url()).hash, '#learn/search/search-playbook');
  }

  await page.locator('#learning-unit-picker').selectOption('case-design-search');
  assert.match(await page.locator('.case-brief').innerText(), /offline maps for hiking/);
  await page.getByRole('link', { name: 'Draft your approach before the walkthrough' }).click();
  assert.equal(new URL(page.url()).hash, '#learn/search/case-design-search');
  await page.locator('#learning-draft').fill('Case design draft');
  await page.locator('.lesson-toolbar [data-action="learn-done"]').click();
  await waitSaved(page);
  await page.goBack();
  assert.equal(await page.locator('#learning-unit-picker').inputValue(), 'case-online-regression');
  await page.goForward();
  assert.equal(await page.locator('#learning-unit-picker').inputValue(), 'case-design-search');
  assert.equal(await page.locator('#learning-draft').inputValue(), 'Case design draft');

  fs.mkdirSync(path.join(root, 'test-artifacts'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'test-artifacts', 'learning-desktop.png'), fullPage: true });

  // A fresh browser receives saved course state through the server route.
  const mobile = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  phone.on('pageerror', (error) => errors.push(error.message));
  await phone.goto(`${url}/#learn/search-framing`);
  await phone.locator('#learning-draft').waitFor();
  assert.equal(await phone.locator('#learning-draft').inputValue(), draft);
  assert.match(await phone.locator('.checkpoint-feedback').innerText(), /Checkpoint cleared/);
  assert.equal(await phone.locator('.lesson-toolbar [data-action="learn-done"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await phone.getByRole('button', { name: 'Learn', exact: true }).click();
  assert.equal(await phone.locator('.module-card').count(), 3);
  assert.equal(await phone.locator('.course-row').count(), 0);
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await phone.screenshot({ path: path.join(root, 'test-artifacts', 'learning-hub-mobile.png') });
  await phone.getByRole('button', { name: 'Open Search & Learning to Rank', exact: true }).click();
  assert.equal(await phone.locator('.course-row').count(), 15);
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await phone.screenshot({ path: path.join(root, 'test-artifacts', 'learning-mobile.png'), fullPage: true });
  await phone.screenshot({ path: path.join(root, 'test-artifacts', 'learning-mobile-viewport.png') });
  await phone.locator('[data-action="learn-done"][data-unit="search-framing"]').click();
  await waitSaved(phone);
  assert.equal(saved.learning.entries['search-framing'].completed, false);
  assert.equal(saved.learning.entries['search-framing'].passed, true);
  assert.equal(saved.xp, 240);
  assert.deepEqual(saved.reviews['t1-q1'], initialReview);

  // Course state travels in the same export payload.
  const persisted = JSON.parse(await phone.evaluate((key) => localStorage.getItem(key), storageKey));
  assert.equal(persisted.learning.entries['case-design-search'].draft, 'Case design draft');
  assert.equal(persisted.notes['t1-q1'], 'Existing note');
  // Exercise the actual export and import, with no real server writes.
  await page.getByRole('button', { name: 'Export progress', exact: true }).click();
  await page.locator('#import-progress').setInputFiles({ name: 'course-export.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(persisted)) });
  await page.getByText('Progress imported', { exact: true }).waitFor();
  await page.locator('#learning-unit-picker').selectOption('search-framing');
  assert.equal(await page.locator('#learning-draft').inputValue(), draft);
  await page.locator('.lesson-bridge [data-topic="t1"]').click();
  assert.equal(new URL(page.url()).hash, '');
  await page.getByRole('heading', { name: 'Machine Learning Fundamentals', exact: true }).waitFor();
  await page.locator('.primary-nav [data-view="learn"]').click();
  await page.screenshot({ path: path.join(root, 'test-artifacts', 'learning-desktop-overview.png') });
  await page.getByRole('button', { name: 'Open Recommendation Fundamentals', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.course-row').count(), 13);
  assert.match(await page.locator('.course-progress').innerText(), /0\/13 units read/);
  await page.locator('[data-action="learn-done"][data-unit="rec-framing"]').click();
  await page.locator('.course-row [data-action="learn-unit"][data-unit="rec-framing"]').click();
  const recDraft = 'Define useful discovery, then compare content and collaborative candidates.';
  await page.locator('#learning-draft').fill(recDraft);
  await page.locator('[data-action="learn-check"][data-choice="1"]').click();
  assert.match(await page.locator('.checkpoint-feedback').innerText(), /Not quite/);
  await page.locator('[data-action="learn-check"][data-choice="0"]').click();
  await waitSaved(page);
  assert.equal(saved.learning.entries['search-framing'].draft, draft);
  assert.equal(saved.learning.entries['rec-framing'].draft, recDraft);
  assert.equal(saved.learning.entries['rec-framing'].passed, true);
  assert.equal(saved.xp, 240);
  await page.reload();
  await page.locator('#learning-draft').waitFor();
  assert.equal(await page.locator('#learning-draft').inputValue(), recDraft);
  assert.equal(await page.locator('#learning-unit-picker option').count(), 13);
  assert.equal(new URL(page.url()).hash, '#learn/recommendations/rec-framing');

  const recIds = await page.locator('#learning-unit-picker option').evaluateAll((items) => items.map((item) => item.value));
  for (const id of recIds) {
    await page.locator('#learning-unit-picker').selectOption(id);
    assert.equal(await page.locator('.lesson-prose > section').count() >= 3, true, id);
    assert.equal(await page.locator('.checkpoint-option').count(), 3, id);
    assert.doesNotMatch(await page.locator('body').innerText(), /interview/i, id);
    await page.locator('.interview-model summary').click();
    assert.doesNotMatch(await page.locator('body').innerText(), /interview/i, `${id} worked answer`);
  }
  await page.locator('#learning-unit-picker').selectOption('rec-content');
  assert.equal(await page.locator('#content-match-results strong').first().innerText(), 'Trail Atlas');
  await page.locator('#content-interest').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#content-interest').inputValue(), '20');
  assert.equal(await page.locator('#content-match-results strong').first().innerText(), 'Task Board');
  assert.equal(await page.locator('.content-score').first().innerText(), '0.800');
  await page.locator('.lesson-toolbar [data-action="learn-done"]').click();
  await page.locator('[data-action="learn-check"][data-choice="2"]').click();
  await waitSaved(page);
  const fresh = await context({ viewport: { width: 390, height: 844 }, isMobile: true });
  const device = await fresh.newPage();
  device.on('pageerror', (error) => errors.push(error.message));
  await device.goto(`${url}/#learn/recommendations/rec-framing`);
  await device.locator('#learning-draft').waitFor();
  assert.equal(await device.locator('#learning-draft').inputValue(), recDraft);
  assert.match(await device.locator('.checkpoint-feedback').innerText(), /Checkpoint cleared/);
  assert.equal(await device.locator('.lesson-toolbar [data-action="learn-done"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await device.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await device.getByRole('button', { name: 'All modules' }).click();
  assert.equal(await device.locator('.module-card').count(), 3);
  assert.match(await device.locator('.module-recommendations .module-progress-label').innerText(), /2\/13 units read/);
  assert.match(await device.locator('.module-search .module-progress-label').innerText(), /1\/15 units read/);
  await device.getByRole('button', { name: 'Open Recommendation Fundamentals', exact: true }).click();
  assert.equal(await device.locator('.course-row').count(), 13);
  await device.getByRole('button', { name: 'Resume learning' }).click();
  assert.equal(await device.locator('#learning-unit-picker').inputValue(), 'rec-content');
  await device.screenshot({ path: path.join(root, 'test-artifacts', 'recommendation-mobile.png') });
  await device.getByRole('button', { name: 'All modules' }).click();
  await device.getByRole('button', { name: 'Open Search & Learning to Rank', exact: true }).click();
  await device.getByRole('button', { name: 'Resume learning' }).click();
  assert.equal(await device.locator('#learning-unit-picker').inputValue(), 'search-framing');
  assert.equal(await device.locator('#learning-draft').inputValue(), draft);
  // Old saved playbook URLs still work, but the visible address is neutral.
  await device.goto(`${url}/#learn/interview-playbook`);
  await device.locator('#learning-unit-picker').waitFor();
  assert.equal(new URL(device.url()).hash, '#learn/search/search-playbook');
  assert.equal(await device.locator('#learning-unit-picker').inputValue(), 'interview-playbook');
  assert.doesNotMatch(await device.locator('body').innerText(), /interview/i);
  await page.locator('.primary-nav [data-view="learn"]').click();
  await page.getByRole('button', { name: 'Open ML in Production', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.course-row').count(), 18);
  assert.match(await page.locator('.course-progress').innerText(), /0\/18 units read/);
  await page.locator('[data-action="learn-done"][data-unit="prod-overview"]').click();
  await page.locator('.course-row [data-action="learn-unit"][data-unit="prod-overview"]').click();
  const productionDraft = 'Define event IDs and the durable acceptance boundary; make sink effects retry-safe.';
  await page.locator('#learning-draft').fill(productionDraft);
  await page.locator('[data-action="learn-check"][data-choice="0"]').click();
  await waitSaved(page);
  await page.reload();
  await page.locator('#learning-draft').waitFor();
  assert.equal(await page.locator('#learning-draft').inputValue(), productionDraft);
  assert.equal(await page.locator('#learning-unit-picker option').count(), 18);
  assert.match(await page.locator('.checkpoint-feedback').innerText(), /Checkpoint cleared/);
  assert.equal(new URL(page.url()).hash, '#learn/production/prod-overview');
  for (const id of await page.locator('#learning-unit-picker option').evaluateAll((items) => items.map((item) => item.value))) {
    await page.locator('#learning-unit-picker').selectOption(id);
    assert.ok(await page.locator('.lesson-prose > section').count() >= 3, id);
    assert.equal(await page.locator('.checkpoint-option').count(), 3, id);
    await page.locator('.interview-model summary').click();
    assert.doesNotMatch(await page.locator('body').innerText(), /interview/i, id);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, id);
  }
  await page.locator('#learning-unit-picker').selectOption('prod-ingestion');
  assert.equal(await page.locator('.pipeline-step').count(), 6);
  await page.locator('[data-action="pipeline-stage"][data-stage="2"]').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('.pipeline-detail').innerText(), /retention|Retention/);
  assert.equal(await page.locator('[data-action="pipeline-stage"][data-stage="2"]').getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('.lesson-code').innerText(), /event_id/);
  await page.locator('#learning-unit-picker').selectOption('prod-storage');
  assert.equal(await page.locator('.lesson-table tbody tr').count(), 7);
  assert.match(await page.locator('.lesson-table').innerText(), /PostgreSQL/);
  await page.locator('#learning-unit-picker').selectOption('prod-scaling');
  assert.match(await page.locator('[data-capacity-result="capacity"]').innerText(), /1,000/);
  assert.equal(await page.locator('[data-capacity-result="drain"]').innerText(), 'Cannot drain');
  await page.locator('#capacity-workers').fill('8');
  assert.match(await page.locator('.capacity-warning').innerText(), /Partition-limited/);
  assert.match(await page.locator('[data-capacity-result="capacity"]').innerText(), /1,000/);
  await page.locator('#capacity-partitions').fill('8');
  assert.match(await page.locator('[data-capacity-result="capacity"]').innerText(), /2,000/);
  assert.equal(await page.locator('[data-capacity-result="drain"]').innerText(), '15.0 s');
  await page.locator('#capacity-workers').fill('0');
  assert.match(await page.locator('#capacity-results').innerText(), /positive whole numbers/);
  await page.locator('#capacity-workers').fill('8');
  await page.screenshot({ path: path.join(root, 'test-artifacts', 'production-capacity-desktop.png'), fullPage: false });
  await page.getByRole('button', { name: 'All modules' }).click();
  await page.screenshot({ path: path.join(root, 'test-artifacts', 'learning-three-modules.png'), fullPage: false });
  const productionDeviceContext = await context({ viewport: { width: 390, height: 844 }, isMobile: true });
  const productionDevice = await productionDeviceContext.newPage();
  productionDevice.on('pageerror', (error) => errors.push(error.message));
  await productionDevice.goto(`${url}/#learn/production/prod-overview`);
  await productionDevice.locator('#learning-draft').waitFor();
  assert.equal(await productionDevice.locator('#learning-draft').inputValue(), productionDraft);
  assert.equal(await productionDevice.locator('.lesson-toolbar [data-action="learn-done"]').getAttribute('aria-pressed'), 'true');
  await productionDevice.locator('#learning-unit-picker').selectOption('prod-storage');
  assert.equal(await productionDevice.locator('.lesson-table tbody tr').count(), 7);
  assert.equal(await productionDevice.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await productionDevice.locator('#learning-unit-picker').selectOption('prod-scaling');
  assert.equal(await productionDevice.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await productionDevice.locator('#capacity-workers').fill('8');
  await productionDevice.locator('#capacity-partitions').fill('8');
  assert.equal(await productionDevice.locator('[data-capacity-result="drain"]').innerText(), '15.0 s');
  await productionDevice.locator('#capacity-lab').scrollIntoViewIfNeeded();
  await productionDevice.screenshot({ path: path.join(root, 'test-artifacts', 'production-capacity-mobile.png') });
  assert.equal(saved.learning.entries['search-framing'].draft, draft);
  assert.equal(saved.learning.entries['rec-framing'].draft, recDraft);
  assert.equal(saved.learning.entries['prod-overview'].draft, productionDraft);
  assert.equal(saved.learning.moduleVisits.production.lastUnitId, 'prod-scaling');
  assert.equal(saved.xp, 240);
  assert.deepEqual(saved.reviews['t1-q1'], initialReview);
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: three module cards, all 46 units, saved module progress, legacy bookmarks, neutral copy, pipeline explorer, storage table, capacity/partition calculations, keyboard, mobile layout, export/import, and separate-browser persistence without changing bank progress.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.kill();
});
