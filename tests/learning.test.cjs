const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sandbox = { window: {}, document: { querySelector: () => ({}) }, localStorage: { getItem: () => null } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'search-course.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'recommendation-course.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'production-course.js'), 'utf8'), sandbox);
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8')
  .replace('  init();', '')
  .replace(/\}\)\(\);\s*$/, 'globalThis.courseTest = { normalizeState, mergeStates, mergeLearning, rankingMetrics, contentMatches, capacityEstimate, learningRoute, parseGuide, studyLanguage }; })();');
vm.runInContext(appSource, sandbox);
const api = sandbox.courseTest;
const plain = (value) => JSON.parse(JSON.stringify(value));
const course = sandbox.window.SEARCH_COURSE;
const unitId = course.lessons[0].id;

test('course contains twelve substantial lessons, three cases, and valid checkpoints', () => {
  assert.equal(course.lessons.length, 12);
  assert.equal(course.cases.length, 3);
  const units = [...course.lessons, ...course.cases];
  assert.equal(new Set(units.map((unit) => unit.id)).size, 15);
  for (const unit of units) {
    assert.ok(unit.blocks.length >= 3);
    assert.ok(unit.blocks.map((block) => block.body).join(' ').length > 1800, unit.id);
    assert.equal(unit.checkpoint.options.length, unit.checkpoint.explanations.length);
    assert.ok(unit.checkpoint.correct >= 0 && unit.checkpoint.correct < unit.checkpoint.options.length);
    for (const source of unit.sources) assert.ok(course.sources[source]?.url.startsWith('https://'));
  }
});

test('legacy progress receives learning defaults without changing existing bank data', () => {
  const input = { version: 1, xp: 123, reviews: { 't1-q1': { attempts: 2, mastery: 3, completed: true } }, notes: { 't1-q1': 'Keep this' } };
  const result = plain(api.normalizeState(input));
  assert.equal(result.xp, input.xp);
  assert.deepEqual(result.reviews, input.reviews);
  assert.deepEqual(result.notes, input.notes);
  assert.deepEqual(result.learning, { entries: {}, lastUnitId: null, lastVisitedAt: 0, moduleVisits: {} });
});

test('learning merge independently preserves latest read toggle, draft deletion, and checkpoint', () => {
  const local = { entries: { [unitId]: { completed: false, completionUpdatedAt: 300, draft: '', draftUpdatedAt: 500, choice: 0, passed: false, attempts: 3, checkpointUpdatedAt: 600 } }, lastUnitId: unitId, lastVisitedAt: 700 };
  const server = { entries: { [unitId]: { completed: true, completionUpdatedAt: 100, draft: 'Old answer', draftUpdatedAt: 200, choice: 1, passed: true, attempts: 2, checkpointUpdatedAt: 400 } }, lastUnitId: course.lessons[1].id, lastVisitedAt: 650 };
  const result = plain(api.mergeLearning(local, server));
  assert.equal(result.lastUnitId, unitId);
  assert.equal(result.entries[unitId].completed, false);
  assert.equal(result.entries[unitId].draft, '');
  assert.equal(result.entries[unitId].choice, 0);
  assert.equal(result.entries[unitId].passed, true);
  assert.equal(result.entries[unitId].attempts, 3);
  assert.deepEqual(plain(api.mergeLearning(server, local)), result);
});

test('different devices contribute independent units without resetting question progress', () => {
  const base = { version: 1, xp: 240, reviews: { 't1-q1': { attempts: 2, mastery: 3 } } };
  const a = { ...base, updatedAt: 100, learning: { entries: { [unitId]: { completed: true, completionUpdatedAt: 100 } } } };
  const b = { ...base, updatedAt: 200, learning: { entries: { [course.cases[0].id]: { draft: 'Design notes', draftUpdatedAt: 200 } } } };
  const result = plain(api.mergeStates(a, b));
  assert.equal(result.xp, 240);
  assert.deepEqual(result.reviews, base.reviews);
  assert.equal(result.learning.entries[unitId].completed, true);
  assert.equal(result.learning.entries[course.cases[0].id].draft, 'Design notes');
});

test('newer full reset wins over earlier course and question progress', () => {
  const old = { version: 1, xp: 240, updatedAt: 100, learning: { entries: { [unitId]: { passed: true, checkpointUpdatedAt: 100 } } } };
  const reset = { version: 1, xp: 0, resetAt: 200, updatedAt: 200, reviews: {} };
  const result = plain(api.mergeStates(old, reset));
  assert.equal(result.xp, 0);
  assert.deepEqual(result.learning.entries, {});
});

test('toy ranking metrics match hand calculations and improve under ideal order', () => {
  const ideal = plain(api.rankingMetrics([0, 1, 2, 3]));
  assert.equal(ideal.ndcg, 1);
  assert.equal(ideal.reciprocalRank, 1);
  assert.equal(ideal.precision, 2 / 3);
  assert.equal(ideal.recall, 1);
  const example = plain(api.rankingMetrics([1, 0, 3, 2]));
  assert.ok(Math.abs(example.ndcg - 0.7896) < 0.001);
  const reversed = plain(api.rankingMetrics([3, 2, 1, 0]));
  assert.equal(reversed.reciprocalRank, 1 / 3);
  assert.equal(reversed.recall, 0.5);
  assert.ok(reversed.ndcg < example.ndcg);
});

test('existing question bank still parses all 444 questions in 28 topics', () => {
  const guide = api.parseGuide(fs.readFileSync(path.join(root, 'ML_INTERVIEW_QNA.md'), 'utf8'));
  assert.equal(guide.questions.length, 444);
  assert.equal(guide.topics.length, 28);
  assert.doesNotMatch(JSON.stringify(plain(guide)), /interview/i);
});

test('recommendation module contains ten substantial lessons and three complete cases', () => {
  const recommendation = sandbox.window.RECOMMENDATION_COURSE;
  assert.equal(recommendation.lessons.length, 10);
  assert.equal(recommendation.cases.length, 3);
  const units = [...course.lessons, ...course.cases, ...recommendation.lessons, ...recommendation.cases];
  assert.equal(new Set(units.map((unit) => unit.id)).size, 28);
  for (const unit of [...recommendation.lessons, ...recommendation.cases]) {
    assert.ok(unit.blocks.length >= 3);
    assert.ok(unit.blocks.map((block) => block.body).join(' ').length > 1800, unit.id);
    assert.equal(unit.checkpoint.options.length, unit.checkpoint.explanations.length);
    assert.ok(unit.checkpoint.correct >= 0 && unit.checkpoint.correct < unit.checkpoint.options.length);
    for (const source of unit.sources) assert.ok(recommendation.sources[source]?.url.startsWith('https://'));
    if (recommendation.cases.includes(unit)) assert.ok(unit.scenario);
  }
});

test('old search resume migrates and each module retains an independent resume point', () => {
  const legacy = api.normalizeState({ version: 1, learning: { entries: { [unitId]: { draft: 'Search draft', draftUpdatedAt: 100 } }, lastUnitId: unitId, lastVisitedAt: 100 } });
  assert.equal(legacy.learning.moduleVisits.search.lastUnitId, unitId);
  const updated = api.normalizeState({ version: 1, learning: { entries: { 'rec-framing': { draft: 'Rec draft', draftUpdatedAt: 200 } }, lastUnitId: 'rec-framing', lastVisitedAt: 200 } });
  const merged = plain(api.mergeLearning(legacy.learning, updated.learning));
  assert.equal(merged.moduleVisits.search.lastUnitId, unitId);
  assert.equal(merged.moduleVisits.recommendations.lastUnitId, 'rec-framing');
  assert.equal(merged.entries[unitId].draft, 'Search draft');
  assert.equal(merged.entries['rec-framing'].draft, 'Rec draft');
});

test('routes distinguish hub, module overview, new lesson URLs, and legacy bookmarks', () => {
  assert.deepEqual(plain(api.learningRoute('#learn')), { moduleId: null, unitId: null });
  assert.deepEqual(plain(api.learningRoute('#learn/search')), { moduleId: 'search', unitId: null });
  assert.deepEqual(plain(api.learningRoute('#learn/recommendations')), { moduleId: 'recommendations', unitId: null });
  assert.deepEqual(plain(api.learningRoute('#learn/search-framing')), { moduleId: 'search', unitId });
  assert.deepEqual(plain(api.learningRoute('#learn/recommendations/rec-framing')), { moduleId: 'recommendations', unitId: 'rec-framing' });
  assert.deepEqual(plain(api.learningRoute('#learn/search/rec-framing')), { moduleId: 'search', unitId: null });
  assert.deepEqual(plain(api.learningRoute('#learning-attempt')), { moduleId: null, unitId: null });
  assert.deepEqual(plain(api.learningRoute('#learn/unknown')), { moduleId: null, unitId: null });
  assert.deepEqual(plain(api.learningRoute('#learn/search/search-playbook')), { moduleId: 'search', unitId: 'interview-playbook' });
  assert.deepEqual(plain(api.learningRoute('#learn/interview-playbook')), { moduleId: 'search', unitId: 'interview-playbook' });
});

test('authored module copy is neutral while legacy saved identifiers are retained', () => {
  for (const module of [course, sandbox.window.RECOMMENDATION_COURSE, sandbox.window.PRODUCTION_COURSE]) {
    const humanCopy = plain(module);
    for (const unit of [...humanCopy.lessons, ...humanCopy.cases]) delete unit.id;
    assert.doesNotMatch(JSON.stringify(humanCopy), /interview/i);
  }
  assert.ok(course.lessons.some((unit) => unit.id === 'interview-playbook'));
  const saved = plain(api.normalizeState({ version: 1, learning: { entries: { 'interview-playbook': { draft: 'Personal interview notes', draftUpdatedAt: 100 } } } }));
  assert.equal(saved.learning.entries['interview-playbook'].draft, 'Personal interview notes');
});

test('content exercise uses the stated dot product and responds to profile changes', () => {
  const outdoor = plain(api.contentMatches(70));
  assert.equal(outdoor[0].name, 'Trail Atlas');
  assert.ok(Math.abs(outdoor[0].score - 0.66) < 1e-10);
  const productivity = plain(api.contentMatches(20));
  assert.equal(productivity[0].name, 'Task Board');
  assert.ok(Math.abs(productivity[0].score - 0.8) < 1e-10);
});

test('production has fifteen substantial lessons, three worked cases, and unique IDs across all modules', () => {
  const production = sandbox.window.PRODUCTION_COURSE;
  assert.equal(production.lessons.length, 15);
  assert.equal(production.cases.length, 3);
  const all = [course, sandbox.window.RECOMMENDATION_COURSE, production].flatMap((module) => [...module.lessons, ...module.cases]);
  assert.equal(all.length, 46);
  assert.equal(new Set(all.map((unit) => unit.id)).size, 46);
  for (const unit of [...production.lessons, ...production.cases]) {
    assert.ok(unit.blocks.length >= 3);
    assert.ok(unit.blocks.map((block) => block.body).join(' ').length > 1800, unit.id);
    assert.equal(unit.checkpoint.options.length, unit.checkpoint.explanations.length);
    assert.ok(unit.checkpoint.correct >= 0 && unit.checkpoint.correct < unit.checkpoint.options.length);
    for (const source of unit.sources) assert.ok(production.sources[source]?.url.startsWith('https://'));
    for (const block of unit.blocks) if (block.table) {
      assert.ok(block.table.caption);
      for (const row of block.table.rows) assert.equal(row.length, block.table.headers.length);
    }
    if (production.cases.includes(unit)) assert.ok(unit.scenario);
  }
});

test('production progress merges without losing search/recommendation notes or resume points', () => {
  const old = api.normalizeState({ version: 1, xp: 240, reviews: { 't1-q1': { completed: true, attempts: 2 } }, learning: {
    entries: { 'search-framing': { draft: 'Search', draftUpdatedAt: 100 }, 'rec-framing': { completed: true, completionUpdatedAt: 150 } },
    moduleVisits: { search: { lastUnitId: 'search-framing', lastVisitedAt: 100 }, recommendations: { lastUnitId: 'rec-framing', lastVisitedAt: 150 } }
  } });
  const newer = api.normalizeState({ version: 1, learning: {
    entries: { 'prod-ingestion': { draft: 'Pipeline', draftUpdatedAt: 200, passed: true, choice: 1, checkpointUpdatedAt: 200 } },
    lastUnitId: 'prod-ingestion', lastVisitedAt: 200
  } });
  const result = plain(api.mergeLearning(old.learning, newer.learning));
  assert.equal(result.entries['search-framing'].draft, 'Search');
  assert.equal(result.entries['rec-framing'].completed, true);
  assert.equal(result.entries['prod-ingestion'].draft, 'Pipeline');
  assert.equal(result.moduleVisits.search.lastUnitId, 'search-framing');
  assert.equal(result.moduleVisits.recommendations.lastUnitId, 'rec-framing');
  assert.equal(result.moduleVisits.production.lastUnitId, 'prod-ingestion');
  assert.deepEqual(plain(api.learningRoute('#learn/production/prod-ingestion')), { moduleId: 'production', unitId: 'prod-ingestion' });
  assert.deepEqual(plain(api.learningRoute('#learn/production')), { moduleId: 'production', unitId: null });
});

test('capacity calculation respects partition limits, continued arrivals, headroom, and invalid inputs', () => {
  const input = { arrival: 1200, workers: 4, partitions: 4, perWorker: 250, backlog: 12000 };
  const first = plain(api.capacityEstimate(input));
  assert.equal(first.capacity, 1000);
  assert.equal(first.growingBy, 200);
  assert.equal(first.drainSeconds, null);
  assert.equal(first.targetWorkers, 7);
  const limited = plain(api.capacityEstimate({ ...input, workers: 8 }));
  assert.equal(limited.capacity, 1000);
  assert.equal(limited.partitionLimited, true);
  const scaled = plain(api.capacityEstimate({ ...input, workers: 8, partitions: 8 }));
  assert.equal(scaled.capacity, 2000);
  assert.equal(scaled.drainSeconds, 15);
  assert.equal(scaled.offeredLoad, 0.6);
  const saturated = plain(api.capacityEstimate({ ...input, arrival: 1000 }));
  assert.equal(saturated.drainSeconds, null);
  assert.ok(api.capacityEstimate({ ...input, workers: 0 }).error);
  assert.ok(api.capacityEstimate({ ...input, partitions: 1.5 }).error);
  assert.ok(api.capacityEstimate({ ...input, perWorker: NaN }).error);
});
