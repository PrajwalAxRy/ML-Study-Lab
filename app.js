(() => {
  'use strict';

  const STORAGE_KEY = 'ml-interview-gym-v2';
  const DAILY_GOAL = 10;
  const LEVEL_SIZE = 180;
  const MAX_SESSION = 10;
  const DAY = 24 * 60 * 60 * 1000;
  const courses = [window.SEARCH_COURSE, window.RECOMMENDATION_COURSE, window.PRODUCTION_COURSE];
  const allCourseUnits = courses.flatMap(unitsFor);
  let course = courses[0];
  let courseUnits = unitsFor(course);
  let rankingOrder = [2, 0, 3, 1];
  let contentInterest = 70;
  let pipelineStage = 0;
  let capacityInputs = { arrival: 1200, workers: 4, perWorker: 250, backlog: 12000, partitions: 4 };

  const elements = {
    main: document.querySelector('#main-content'),
    trail: document.querySelector('#skill-trail'),
    fieldLog: document.querySelector('#field-log'),
    toastRegion: document.querySelector('#toast-region'),
    srStatus: document.querySelector('#sr-status'),
    studyRail: document.querySelector('#study-rail'),
    railScrim: document.querySelector('#rail-scrim'),
    openMenu: document.querySelector('#open-menu'),
    mobileLevel: document.querySelector('#mobile-level'),
    resetConfirm: document.querySelector('#reset-confirm')
  };

  let guide = { priorities: [], topics: [], questions: [] };
  let state = loadState();
  let syncTimer = null;
  let advanceTimer = null;
  let syncStatus = 'loading';
  let lastServerSave = null;
  let collapsedPriorities = new Set();
  let current = {
    view: 'home',
    topicId: null,
    search: '',
    filter: 'all',
    session: null
  };

  init();

  async function init() {
    bindGlobalEvents();
    try {
      const [response, serverState] = await Promise.all([
        fetch('/ML_INTERVIEW_QNA.md', { cache: 'no-store' }),
        loadServerState()
      ]);
      if (!response.ok) throw new Error(`Study guide returned ${response.status}`);
      state = mergeStates(state, serverState);
      guide = parseGuide(await response.text());
      if (!guide.questions.length) throw new Error('No questions were found in the study guide');
      let migrated = false;
      guide.questions.forEach((question) => {
        const review = state.reviews[question.id];
        if (review?.completed === true && !review.attempts) {
          recordRecall(question.id, 'easy', { now: review.completionUpdatedAt || Date.now(), completion: true });
          migrated = true;
        }
      });
      if (migrated) state.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      applyLearningLocation();
      renderEverything();
      scheduleServerSave(0);
    } catch (error) {
      renderLoadError(error);
    }
  }

  function defaultState() {
    return {
      version: 1,
      xp: 0,
      reviews: {},
      notes: {},
      bookmarks: [],
      daily: {},
      learning: { entries: {}, lastUnitId: null, lastVisitedAt: 0, moduleVisits: {} },
      completedChallenges: 0,
      lastChallengeBonus: null,
      resetAt: null
    };
  }

  function normalizeState(value) {
    if (!value || value.version !== 1) return defaultState();
    return {
      ...defaultState(),
      ...value,
      xp: Number.isFinite(value.xp) ? Math.max(0, value.xp) : 0,
      reviews: value.reviews && typeof value.reviews === 'object' ? value.reviews : {},
      notes: value.notes && typeof value.notes === 'object' ? value.notes : {},
      bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [],
      daily: value.daily && typeof value.daily === 'object' ? value.daily : {},
      learning: normalizeLearning(value.learning)
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1) return defaultState();
      return normalizeState(saved);
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    scheduleServerSave();
  }

  async function loadServerState() {
    try {
      const response = await fetch('/api/progress', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Progress server returned ${response.status}`);
      syncStatus = 'loaded';
      return await response.json();
    } catch {
      syncStatus = 'offline';
      return null;
    }
  }

  function mergeStates(localValue, serverValue) {
    const local = normalizeState(localValue);
    if (!serverValue) return local;
    const server = normalizeState(serverValue);
    const localReset = local.resetAt || 0;
    const serverReset = server.resetAt || 0;
    if (localReset > (server.updatedAt || 0)) return local;
    if (serverReset > (local.updatedAt || 0)) return server;
    const localIsNewer = (local.updatedAt || 0) >= (server.updatedAt || 0);
    const newer = localIsNewer ? local : server;
    const older = localIsNewer ? server : local;
    const reviews = { ...older.reviews };

    Object.entries(newer.reviews).forEach(([questionId, review]) => {
      const existing = reviews[questionId];
      const reviewTime = review?.updatedAt || review?.lastReviewed || 0;
      const existingTime = existing?.updatedAt || existing?.lastReviewed || 0;
      const latestReview = !existing || reviewTime >= existingTime ? review : existing;
      const latestCompletion = (review?.completionUpdatedAt || 0) >= (existing?.completionUpdatedAt || 0) ? review : existing;
      reviews[questionId] = latestCompletion?.completionUpdatedAt
        ? { ...latestReview, completed: latestCompletion.completed, completionUpdatedAt: latestCompletion.completionUpdatedAt }
        : latestReview;
    });

    const daily = {};
    new Set([...Object.keys(local.daily), ...Object.keys(server.daily)]).forEach((day) => {
      const localDay = local.daily[day] || { questions: [], xp: 0 };
      const serverDay = server.daily[day] || { questions: [], xp: 0 };
      daily[day] = {
        questions: [...new Set([...(localDay.questions || []), ...(serverDay.questions || [])])],
        xp: Math.max(localDay.xp || 0, serverDay.xp || 0)
      };
    });

    return normalizeState({
      ...older,
      ...newer,
      xp: Math.max(local.xp, server.xp),
      reviews,
      notes: { ...older.notes, ...newer.notes },
      bookmarks: [...new Set([...local.bookmarks, ...server.bookmarks])],
      daily,
      learning: mergeLearning(local.learning, server.learning),
      completedChallenges: Math.max(local.completedChallenges || 0, server.completedChallenges || 0),
      lastChallengeBonus: [local.lastChallengeBonus, server.lastChallengeBonus].filter(Boolean).sort().at(-1) || null,
      updatedAt: Math.max(local.updatedAt || 0, server.updatedAt || 0)
    });
  }

  function scheduleServerSave(delay = 500) {
    clearTimeout(syncTimer);
    syncStatus = 'saving';
    updateSyncIndicator();
    syncTimer = setTimeout(syncStateToServer, delay);
  }

  async function syncStateToServer() {
    syncTimer = null;
    try {
      const response = await fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (!response.ok) throw new Error(`Progress server returned ${response.status}`);
      const result = await response.json();
      syncStatus = 'saved';
      lastServerSave = result.savedAt ? new Date(result.savedAt) : new Date();
    } catch {
      syncStatus = 'offline';
    }
    updateSyncIndicator();
  }

  function parseGuide(markdown) {
    const result = { priorities: [], topics: [], questions: [] };
    const lines = studyLanguage(markdown).replace(/\r/g, '').split('\n');
    let priority = null;
    let topic = null;
    let question = null;

    const finishQuestion = () => {
      if (!question) return;
      while (question.answerLines.length && !question.answerLines[0].trim()) question.answerLines.shift();
      while (question.answerLines.length && (!question.answerLines.at(-1).trim() || question.answerLines.at(-1).trim() === '---')) {
        question.answerLines.pop();
      }
      question.answer = question.answerLines.join('\n');
      delete question.answerLines;
      result.questions.push(question);
      topic.questions.push(question.id);
      question = null;
    };

    for (const line of lines) {
      const priorityMatch = line.match(/^# Priority (\d+):\s*(.+)$/);
      const topicMatch = line.match(/^## (\d+)\.\s*(.+)$/);
      const questionMatch = line.match(/^### Q(\d+)\.\s*(.+)$/);

      if (priorityMatch) {
        finishQuestion();
        priority = {
          id: `p${priorityMatch[1]}`,
          number: Number(priorityMatch[1]),
          title: priorityMatch[2].trim(),
          topics: []
        };
        result.priorities.push(priority);
        topic = null;
        continue;
      }

      if (topicMatch) {
        finishQuestion();
        topic = {
          id: `t${topicMatch[1]}`,
          number: Number(topicMatch[1]),
          title: topicMatch[2].trim(),
          priorityId: priority?.id || 'p0',
          questions: []
        };
        result.topics.push(topic);
        priority?.topics.push(topic.id);
        continue;
      }

      if (questionMatch && topic) {
        finishQuestion();
        question = {
          id: `${topic.id}-q${questionMatch[1]}`,
          number: Number(questionMatch[1]),
          prompt: questionMatch[2].trim(),
          topicId: topic.id,
          priorityId: topic.priorityId,
          answerLines: []
        };
        continue;
      }

      if (/^#\s/.test(line) && !priorityMatch) {
        finishQuestion();
        topic = null;
        continue;
      }

      if (question) question.answerLines.push(line);
    }

    finishQuestion();
    return result;
  }

  // Neutral presentation of the original bank; IDs, ratings, and personal notes stay intact.
  function studyLanguage(value) {
    return String(value ?? '')
      .replace(/Final Interview Preparation/gi, 'Applied ML and Technical Communication')
      .replace(/\binterview-ready\b/gi, 'clear')
      .replace(/\binterview questions\b/gi, 'review questions')
      .replace(/\binterview question\b/gi, 'review question')
      .replace(/\binterview answers\b/gi, 'explanations')
      .replace(/\binterview answer\b/gi, 'explanation')
      .replace(/\binterview preparation\b/gi, 'technical revision')
      .replace(/\binterviewers\b/gi, 'reviewers')
      .replace(/\binterviewer\b/gi, 'reviewer')
      .replace(/\binterviewing\b/gi, 'technical discussion')
      .replace(/\binterviews\b/gi, 'technical discussions')
      .replace(/\binterview\b/gi, 'technical review')
      .replace(/\ban technical review\b/gi, 'a technical review');
  }

  function bindGlobalEvents() {
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('change', (event) => {
      if (event.target.id === 'learning-unit-picker') openLearningUnit(event.target.value);
    });
    window.addEventListener('popstate', () => {
      if (isLearningLocation()) {
        applyLearningLocation();
        renderEverything();
        scrollMainToTop();
      } else if (current.view === 'learn') navigate('home', false);
    });

    elements.openMenu.addEventListener('click', () => {
      const open = !elements.studyRail.classList.contains('is-open');
      setMenuOpen(open);
    });
    elements.railScrim.addEventListener('click', () => setMenuOpen(false));

    document.querySelector('#collapse-all').addEventListener('click', () => {
      if (collapsedPriorities.size === guide.priorities.length) {
        collapsedPriorities.clear();
      } else {
        collapsedPriorities = new Set(guide.priorities.map((item) => item.id));
      }
      renderTrail();
    });

    document.querySelector('#export-progress').addEventListener('click', exportProgress);
    document.querySelector('#import-progress').addEventListener('change', importProgress);
    document.querySelector('#reset-progress').addEventListener('click', () => {
      elements.resetConfirm.hidden = false;
    });
    document.querySelector('#cancel-reset').addEventListener('click', () => {
      elements.resetConfirm.hidden = true;
    });
    document.querySelector('#confirm-reset').addEventListener('click', resetProgress);
  }

  function handleClick(event) {
    const lessonJump = event.target.closest('a[href^="#"]');
    if (current.view === 'learn' && lessonJump && !/^#learn(?:\/|$)/.test(lessonJump.getAttribute('href'))) {
      const target = document.getElementById(lessonJump.getAttribute('href').slice(1));
      if (target && elements.main.contains(target)) {
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        return;
      }
    }
    const viewTarget = event.target.closest('[data-view]');
    if (viewTarget) {
      navigate(viewTarget.dataset.view);
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;

    const { action, topic, question, priority, rating } = actionTarget.dataset;
    if (action === 'quick-practice') startQuickPractice();
    if (action === 'challenge') startChallenge();
    if (action === 'topic') openTopic(topic);
    if (action === 'priority-toggle') togglePriority(priority);
    if (action === 'start-topic') startTopicPractice(topic);
    if (action === 'open-question') openQuestion(question);
    if (action === 'toggle-done') toggleQuestionDone(question);
    if (action === 'reveal') revealAnswer();
    if (action === 'skip') advanceQuestion();
    if (action === 'previous-question') navigateQuestion(-1);
    if (action === 'next-question') navigateQuestion(1);
    if (action === 'rate') rateCurrentQuestion(rating);
    if (action === 'bookmark') toggleBookmark(question);
    if (action === 'note-toggle') toggleNoteArea();
    if (action === 'set-filter') setLibraryFilter(actionTarget.dataset.filter);
    if (action === 'practice-saved') startSavedPractice();
    if (action === 'practice-again') restartCurrentSession();
    if (action === 'finish-home') navigate('home');
    if (action === 'back') goBackFromPractice();
    if (action === 'learn-unit') openLearningUnit(actionTarget.dataset.unit);
    if (action === 'learn-module') openLearningModule(actionTarget.dataset.module);
    if (action === 'learn-done') toggleLearningDone(actionTarget.dataset.unit);
    if (action === 'learn-check') answerLearningCheckpoint(actionTarget.dataset.unit, Number(actionTarget.dataset.choice));
    if (action === 'rank-move') moveRankingItem(Number(actionTarget.dataset.index), Number(actionTarget.dataset.direction));
    if (action === 'pipeline-stage') selectPipelineStage(Number(actionTarget.dataset.stage));
  }

  function handleInput(event) {
    if (event.target.dataset.capacity) {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        capacityInputs[event.target.dataset.capacity] = value;
        document.querySelector('#capacity-results').innerHTML = renderCapacityResults();
      }
      return;
    }
    if (event.target.id === 'content-interest') {
      contentInterest = Number(event.target.value);
      document.querySelector('#content-interest-label').textContent = `${contentInterest}% outdoor · ${100 - contentInterest}% productivity`;
      document.querySelector('#content-match-results').innerHTML = renderContentMatches();
      return;
    }
    if (event.target.id === 'learning-draft') {
      const entry = learningEntry(current.unitId);
      state.learning.entries[current.unitId] = { ...entry, draft: event.target.value, draftUpdatedAt: Date.now() };
      saveState();
      return;
    }
    if (event.target.id === 'library-search') {
      current.search = event.target.value;
      renderLibrary(true);
      return;
    }

    if (event.target.id === 'attempt-input' && current.session) {
      current.session.attempt = event.target.value;
      return;
    }

    if (event.target.id === 'note-input' && current.session) {
      const question = getCurrentQuestion();
      if (!question) return;
      const value = event.target.value;
      if (value.trim()) state.notes[question.id] = value;
      else delete state.notes[question.id];
      saveState();
      updateBookmarkAndNoteState(question.id);
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if (elements.studyRail.classList.contains('is-open')) setMenuOpen(false);
      return;
    }

    if (current.view !== 'practice' || !current.session) return;
    const typing = /^(TEXTAREA|INPUT)$/.test(document.activeElement?.tagName);
    if (typing) return;

    if (event.code === 'Space' && !current.session.revealed) {
      event.preventDefault();
      revealAnswer();
    } else if (current.session.revealed && ['1', '2', '3'].includes(event.key)) {
      event.preventDefault();
      rateCurrentQuestion({ 1: 'again', 2: 'got-it', 3: 'easy' }[event.key]);
    } else if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      const question = getCurrentQuestion();
      if (question) toggleBookmark(question.id);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      navigateQuestion(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }

  function navigate(view, updateLocation = true) {
    clearTimeout(advanceTimer);
    current.view = view;
    current.session = null;
    current.topicId = view === 'topic' ? current.topicId : null;
    current.unitId = null;
    current.moduleId = null;
    if (updateLocation && (view === 'learn' || isLearningLocation())) {
      history.pushState(null, '', view === 'learn' ? '#learn' : location.pathname + location.search);
    }
    setMenuOpen(false);
    updateNav();
    renderMain();
    renderFieldLog();
    scrollMainToTop();
  }

  function openTopic(topicId) {
    if (!topicById(topicId)) return;
    leaveLearningLocation();
    current.view = 'topic';
    current.topicId = topicId;
    current.session = null;
    setMenuOpen(false);
    updateNav();
    renderTrail();
    renderMain();
    renderFieldLog();
    scrollMainToTop();
  }

  function renderEverything() {
    renderTrail();
    renderMain();
    renderFieldLog();
    updateNav();
  }

  function renderMain() {
    if (current.view === 'home') renderHome();
    else if (current.view === 'topic') renderTopic();
    else if (current.view === 'library') renderLibrary();
    else if (current.view === 'saved') renderSaved();
    else if (current.view === 'practice') renderPractice();
    else if (current.view === 'learn') renderLearning();
  }

  function normalizeLearning(value) {
    const entries = {};
    for (const unit of allCourseUnits) {
      const entry = value?.entries?.[unit.id];
      if (!entry || typeof entry !== 'object') continue;
      const timestamp = (key) => Number.isFinite(entry[key]) ? Math.max(0, entry[key]) : 0;
      entries[unit.id] = {
        completed: entry.completed === true,
        completionUpdatedAt: timestamp('completionUpdatedAt'),
        draft: typeof entry.draft === 'string' ? entry.draft.slice(0, 20000) : '',
        draftUpdatedAt: timestamp('draftUpdatedAt'),
        choice: Number.isInteger(entry.choice) && entry.choice >= 0 && entry.choice < unit.checkpoint.options.length ? entry.choice : null,
        passed: entry.passed === true,
        attempts: Number.isInteger(entry.attempts) ? Math.max(0, entry.attempts) : 0,
        checkpointUpdatedAt: timestamp('checkpointUpdatedAt')
      };
    }
    const moduleVisits = {};
    for (const module of courses) {
      const saved = value?.moduleVisits?.[module.id];
      const legacy = unitsFor(module).some((unit) => unit.id === value?.lastUnitId)
        ? { lastUnitId: value.lastUnitId, lastVisitedAt: value.lastVisitedAt }
        : null;
      const visit = saved || legacy;
      if (visit && unitsFor(module).some((unit) => unit.id === visit.lastUnitId)) {
        moduleVisits[module.id] = { lastUnitId: visit.lastUnitId, lastVisitedAt: Number.isFinite(visit.lastVisitedAt) ? Math.max(0, visit.lastVisitedAt) : 0 };
      }
    }
    return {
      entries,
      lastUnitId: allCourseUnits.some((unit) => unit.id === value?.lastUnitId) ? value.lastUnitId : null,
      lastVisitedAt: Number.isFinite(value?.lastVisitedAt) ? Math.max(0, value.lastVisitedAt) : 0,
      moduleVisits
    };
  }

  function mergeLearning(localValue, serverValue) {
    const local = normalizeLearning(localValue);
    const server = normalizeLearning(serverValue);
    const latest = local.lastVisitedAt >= server.lastVisitedAt ? local : server;
    const entries = {};
    for (const id of new Set([...Object.keys(local.entries), ...Object.keys(server.entries)])) {
      const a = local.entries[id] || {};
      const b = server.entries[id] || {};
      const completion = (a.completionUpdatedAt || 0) >= (b.completionUpdatedAt || 0) ? a : b;
      const draft = (a.draftUpdatedAt || 0) >= (b.draftUpdatedAt || 0) ? a : b;
      const checkpoint = (a.checkpointUpdatedAt || 0) >= (b.checkpointUpdatedAt || 0) ? a : b;
      entries[id] = {
        completed: completion.completed === true,
        completionUpdatedAt: completion.completionUpdatedAt || 0,
        draft: draft.draft || '', draftUpdatedAt: draft.draftUpdatedAt || 0,
        choice: checkpoint.choice ?? null, checkpointUpdatedAt: checkpoint.checkpointUpdatedAt || 0,
        passed: a.passed === true || b.passed === true,
        attempts: Math.max(a.attempts || 0, b.attempts || 0)
      };
    }
    const moduleVisits = {};
    for (const module of courses) {
      const a = local.moduleVisits[module.id];
      const b = server.moduleVisits[module.id];
      if (a || b) moduleVisits[module.id] = !a ? b : !b || a.lastVisitedAt >= b.lastVisitedAt ? a : b;
    }
    return normalizeLearning({ ...latest, entries, moduleVisits });
  }

  function learningEntry(id) {
    return state.learning.entries[id] || { completed: false, draft: '', choice: null, passed: false, attempts: 0 };
  }

  function learningCompletedCount(units = allCourseUnits) {
    return units.filter((unit) => learningEntry(unit.id).completed).length;
  }

  function learningPassedCount(units = allCourseUnits) {
    return units.filter((unit) => learningEntry(unit.id).passed).length;
  }

  function unitsFor(module) {
    return [...module.lessons, ...module.cases];
  }

  function courseForUnit(id) {
    return courses.find((module) => unitsFor(module).some((unit) => unit.id === id));
  }

  function learningRoute(hash) {
    const empty = { moduleId: null, unitId: null };
    if (!/^#learn(?:\/|$)/.test(hash)) return empty;
    const [, moduleOrUnit, rawUnitId] = hash.split('/');
    const unitId = rawUnitId === 'search-playbook' ? 'interview-playbook' : rawUnitId;
    const module = courses.find((item) => item.id === moduleOrUnit);
    if (module) return { moduleId: module.id, unitId: unitsFor(module).some((unit) => unit.id === unitId) ? unitId : null };
    // Preserve old search lesson bookmarks and saved identifiers.
    const legacyId = moduleOrUnit === 'search-playbook' ? 'interview-playbook' : moduleOrUnit;
    const legacyOwner = courseForUnit(legacyId);
    return legacyOwner ? { moduleId: legacyOwner.id, unitId: legacyId } : empty;
  }

  function selectCourse(id) {
    course = courses.find((module) => module.id === id) || courses[0];
    courseUnits = unitsFor(course);
  }

  function applyLearningLocation() {
    if (!isLearningLocation()) return;
    const route = learningRoute(location.hash);
    current.view = 'learn';
    current.topicId = null;
    current.session = null;
    current.moduleId = route.moduleId;
    current.unitId = route.unitId;
    selectCourse(route.moduleId);
    if (route.unitId === 'interview-playbook') {
      history.replaceState(null, '', '#learn/search/search-playbook');
    }
  }

  function leaveLearningLocation() {
    current.unitId = null;
    current.moduleId = null;
    if (isLearningLocation()) history.pushState(null, '', location.pathname + location.search);
  }

  function isLearningLocation() {
    return /^#learn(?:\/|$)/.test(location.hash);
  }

  function openLearningUnit(id) {
    const owner = courseForUnit(id);
    if (!owner) return;
    selectCourse(owner.id);
    clearTimeout(advanceTimer);
    current.view = 'learn';
    current.unitId = id;
    current.moduleId = owner.id;
    current.topicId = null;
    current.session = null;
    state.learning.lastUnitId = id;
    state.learning.lastVisitedAt = Date.now();
    state.learning.moduleVisits[owner.id] = { lastUnitId: id, lastVisitedAt: state.learning.lastVisitedAt };
    saveState();
    history.pushState(null, '', `#learn/${owner.id}/${id === 'interview-playbook' ? 'search-playbook' : id}`);
    setMenuOpen(false);
    updateNav();
    renderTrail();
    renderLearning();
    renderFieldLog();
    scrollMainToTop();
  }

  function renderLearning() {
    if (!current.moduleId) {
      renderLearningHub();
      return;
    }
    selectCourse(current.moduleId);
    const unit = courseUnits.find((item) => item.id === current.unitId);
    if (unit) renderLearningUnit(unit);
    else renderLearningOverview();
  }

  function openLearningModule(id) {
    if (!courses.some((module) => module.id === id)) return;
    clearTimeout(advanceTimer);
    selectCourse(id);
    current.view = 'learn';
    current.moduleId = id;
    current.unitId = null;
    current.topicId = null;
    current.session = null;
    history.pushState(null, '', `#learn/${id}`);
    setMenuOpen(false);
    renderEverything();
    scrollMainToTop();
  }

  function renderLearningHub() {
    elements.main.innerHTML = `<div class="workspace-inner learning-hub">
      <header class="page-header"><div><span class="session-label">Applied ML track</span><h1>Learning room</h1><p>Choose a module. Open its lessons and cases, practice your reasoning, and pick up where you left off.</p></div></header>
      <section class="module-cards" aria-label="Learning modules">${courses.map((module, index) => {
        const units = unitsFor(module);
        const completed = learningCompletedCount(units);
        const passed = learningPassedCount(units);
        const visit = state.learning.moduleVisits[module.id];
        const resume = units.find((unit) => unit.id === visit?.lastUnitId);
        return `<button class="module-card module-${module.id}" type="button" data-action="learn-module" data-module="${module.id}" aria-label="Open ${escAttribute(module.title)}">
          <span class="module-kicker">Module 0${index + 1} · ${module.lessons.length} lessons · ${module.cases.length} cases</span>
          <strong class="module-title">${esc(module.title)}</strong><span class="module-description">${esc(module.description)}</span>
          <span class="module-progress-label">${completed}/${units.length} units read · ${passed}/${units.length} checkpoints cleared</span>
          <span class="module-progress-track" aria-label="${completed} of ${units.length} units read"><span style="width:${completed / units.length * 100}%"></span></span>
          <span class="module-resume">${resume ? `Last opened: ${esc(resume.title)}` : esc(module.startHint || (index === 0 ? 'Start with query intent, retrieval, and ranking.' : 'Start with users, items, and feedback.'))}</span><span class="module-open">Open module <span aria-hidden="true">→</span></span>
        </button>`;
      }).join('')}</section>
      <p class="module-save-note">Each module has its own progress and resume point. Notes and checkpoint results are saved with your existing study progress. Reading does not change question-bank mastery or XP.</p>
      <section class="module-study-guide"><h2>Choose your next step</h2><p><strong>Search</strong> starts from an explicit query. <strong>Recommendations</strong> starts from a user, item, or context. <strong>ML in Production</strong> connects data ingestion, databases, training, serving, and operations. All three build on your ML question bank.</p></section>
    </div>`;
  }

  function learningDoneButton(unit) {
    const done = learningEntry(unit.id).completed;
    return `<button class="completion-button${done ? ' is-done' : ''}" type="button" data-action="learn-done" data-unit="${unit.id}" aria-pressed="${done}" aria-label="${done ? 'Mark unread' : 'Mark read'}: ${escAttribute(unit.title)}">${done ? '✓ Read' : 'Mark read'}</button>`;
  }

  function renderLearningOverview() {
    const completed = learningCompletedCount(courseUnits);
    const passed = learningPassedCount(courseUnits);
    const resume = courseUnits.find((unit) => unit.id === state.learning.moduleVisits[course.id]?.lastUnitId);
    const next = courseUnits.find((unit) => !learningEntry(unit.id).completed) || courseUnits[0];
    const phases = [...new Set(course.lessons.map((unit) => unit.phase))];
    elements.main.innerHTML = `
      <div class="workspace-inner learning-room">
        <button class="back-button" type="button" data-view="learn">← All modules</button>
        <header class="page-header"><div><span class="session-label">Learning room · Applied ML track</span><h1>${esc(course.title)}</h1><p>${esc(course.description)}</p></div></header>
        <section class="course-start" aria-labelledby="course-start-title">
          <div><h2 id="course-start-title">Learn the concepts. Practice the reasoning.</h2><p>Build on your ML bank. Read an explanation, try saying it aloud, compare your answer, and clear a checkpoint.</p>
            <div class="course-actions"><button class="primary-button" type="button" data-action="learn-unit" data-unit="${resume?.id || next.id}">${resume ? 'Resume learning' : 'Start the first lesson'} →</button><a class="text-button" href="#course-cases">Go to case studies ↓</a></div>
            ${resume ? `<p class="course-resume">Last opened: ${esc(resume.title)}</p>` : ''}
          </div>
          <div class="course-progress"><strong>${completed}/${courseUnits.length} units read</strong><progress value="${completed}" max="${courseUnits.length}" aria-label="Course units marked read"></progress><span>${passed}/${courseUnits.length} checkpoints cleared</span><small>Reading is completion, not mastery. Checkpoints test one idea; practice explanations for depth.</small></div>
        </section>
        <div class="course-milestones" aria-label="Checkpoint milestones">${(course.milestones || [
          [course.id === 'search' ? 'Search foundations' : 'Recommendation foundations', 4], [course.id === 'search' ? 'Ranker builder' : 'Candidate builder', 8], ['Applied reasoning', courseUnits.length]
        ]).map(([title, target]) => `<span class="course-milestone${passed >= target ? ' is-earned' : ''}">${passed >= target ? '✓' : '○'} ${title}<small>${target} checkpoints</small></span>`).join('')}</div>
        <section class="course-path" aria-labelledby="course-path-title"><h2 id="course-path-title">${course.lessons.length} lessons, in study order</h2><p>You need the ML bank, not prior ${course.id === 'production' ? 'production systems' : course.id === 'search' ? 'search' : 'recommendation'} experience. Revisit any lesson and mark it read directly from this list.</p>
          ${phases.map((phase, phaseIndex) => `<section class="course-phase"><h3><span>0${phaseIndex + 1}</span>${esc(phase)}</h3><ol start="${course.lessons.findIndex((unit) => unit.phase === phase) + 1}">${course.lessons.filter((unit) => unit.phase === phase).map(renderLearningRow).join('')}</ol></section>`).join('')}
        </section>
        <section class="course-path" id="course-cases" aria-labelledby="course-cases-title"><span class="session-label">Apply the ideas</span><h2 id="course-cases-title">Three worked case studies</h2><p>Hypothetical design exercises, not accounts of Apple's internal systems. Try a design before reading the walkthrough.</p><ol>${course.cases.map(renderLearningRow).join('')}</ol></section>
        <details class="course-glossary"><summary>Quick glossary: ${course.glossary.length} useful terms</summary><dl>${course.glossary.map(([term, definition]) => `<dt>${esc(term)}</dt><dd>${esc(definition)}</dd>`).join('')}</dl></details>
      </div>`;
  }

  function renderLearningRow(unit) {
    const entry = learningEntry(unit.id);
    const index = courseUnits.indexOf(unit) + 1;
    return `<li class="course-row${entry.completed ? ' is-read' : ''}"><button class="course-open" type="button" data-action="learn-unit" data-unit="${unit.id}"><span class="course-unit-number" aria-hidden="true">${String(index).padStart(2, '0')}</span><span><strong>${esc(unit.title)}</strong><small>${esc(unit.subtitle)}</small><span class="course-row-meta">${unit.minutes} min read${entry.passed ? ' · ✓ Checkpoint cleared' : ' · Checkpoint to try'}</span></span></button>${learningDoneButton(unit)}</li>`;
  }

  function renderLearningUnit(unit) {
    const index = courseUnits.indexOf(unit);
    const isCase = course.cases.includes(unit);
    elements.main.innerHTML = `
      <div class="workspace-inner learning-reader">
        <div class="lesson-breadcrumbs"><button class="back-button" type="button" data-view="learn">← All modules</button><button class="text-button" type="button" data-action="learn-module" data-module="${course.id}">${esc(course.title)} / lessons</button></div>
        <header class="page-header"><div><span class="session-label">${isCase ? `Case study ${course.cases.indexOf(unit) + 1} of ${course.cases.length} · Hypothetical` : `Lesson ${index + 1} of ${course.lessons.length} · ${esc(unit.phase)}`}</span><h1>${esc(unit.title)}</h1><p>${esc(unit.subtitle)}</p></div></header>
        <div class="lesson-toolbar"><span>${unit.minutes} min read · ${learningEntry(unit.id).passed ? '✓ Checkpoint cleared' : 'One checkpoint'}</span>${learningDoneButton(unit)}</div>
        <div class="learning-sync" id="learning-sync">${renderSyncIndicator()}</div>
        <div class="lesson-picker"><label for="learning-unit-picker">Jump to a lesson or case</label><select id="learning-unit-picker">${courseUnits.map((item, number) => `<option value="${item.id}"${item.id === unit.id ? ' selected' : ''}>${number + 1}. ${esc(item.title)}</option>`).join('')}</select></div>
        ${unit.scenario ? `<section class="case-brief"><span class="session-label">Design prompt</span><p>${esc(unit.scenario)}</p><a href="#learning-attempt">Draft your approach before the walkthrough ↓</a></section>` : `<div class="lesson-bridge"><strong>Connect to what you know:</strong> ${unit.bridge.map((number) => {
          const topic = topicById(`t${number}`);
          return `<button class="text-button" type="button" data-action="topic" data-topic="t${number}">${esc(topic?.title || `Topic ${number}`)}</button>`;
        }).join(' · ')}</div>`}
        <nav class="lesson-outline" aria-label="In this lesson"><strong>In this ${isCase ? 'case' : 'lesson'}</strong><ol>${unit.blocks.map((block, number) => `<li><a href="#lesson-section-${number}">${esc(block.title)}</a></li>`).join('')}<li><a href="#learning-attempt">Practice your explanation</a></li><li><a href="#learning-checkpoint">Clear the checkpoint</a></li></ol></nav>
        <article class="lesson-prose" aria-label="${escAttribute(unit.title)} explanation">${unit.blocks.map((block, number) => `<section id="lesson-section-${number}"><h2>${esc(block.title)}</h2>${renderMarkdown(block.body)}${block.code ? `<pre class="lesson-code" tabindex="0" aria-label="${escAttribute(block.codeLabel || 'Illustrative code, not executed')}"><code>${esc(block.code)}</code></pre>` : ''}${block.table ? renderLessonTable(block.table) : ''}</section>`).join('')}</article>
        ${unit.pipeline ? renderPipelineExplorer(unit) : ''}
        ${unit.lab === 'capacity' ? renderCapacityLab() : unit.lab === 'content' ? renderContentLab() : unit.lab ? renderRankingLab() : ''}
        <section class="interview-attempt" id="learning-attempt" aria-labelledby="learning-attempt-title"><span class="session-label">Say it before you read it</span><h2 id="learning-attempt-title">Practice your explanation</h2><p>${esc(unit.prompt)}</p><label for="learning-draft">Your answer or notes <span>(saved automatically)</span></label><textarea id="learning-draft" maxlength="20000" rows="6" placeholder="State your assumptions, explain the mechanism, give an example, and name a trade-off.">${esc(learningEntry(unit.id).draft)}</textarea><p class="draft-hint">Try 30 seconds, then two minutes. This is self-practice, not an AI grading tool.</p><details class="interview-model"><summary>Compare with a worked answer</summary><div class="lesson-prose">${renderMarkdown(unit.answer)}</div><h3>Avoid these traps</h3><ul>${unit.pitfalls.map((pitfall) => `<li>${esc(pitfall)}</li>`).join('')}</ul></details></section>
        ${renderLearningCheckpoint(unit)}
        ${unit.sources.length ? `<section class="lesson-sources"><h2>Optional primary-source reading</h2><p>The explanations and practice cases are written for this course. These references let you go deeper.</p><ul>${unit.sources.map((key) => `<li><a href="${course.sources[key].url}" target="_blank" rel="noopener noreferrer">${esc(course.sources[key].title)} ↗</a></li>`).join('')}</ul></section>` : ''}
        <footer class="lesson-footer"><p>Mark read when you finish. You can undo it; reading does not change question-bank mastery or XP.</p><div class="course-actions">${learningDoneButton(unit)}${index > 0 ? `<button class="secondary-button" type="button" data-action="learn-unit" data-unit="${courseUnits[index - 1].id}">← Previous</button>` : ''}${index < courseUnits.length - 1 ? `<button class="primary-button" type="button" data-action="learn-unit" data-unit="${courseUnits[index + 1].id}">${index === course.lessons.length - 1 ? 'Start the case studies' : 'Next unit'} →</button>` : `<button class="primary-button" type="button" data-action="learn-module" data-module="${course.id}">View your module progress →</button>`}</div></footer>
      </div>`;
  }

  function renderLearningCheckpoint(unit) {
    const entry = learningEntry(unit.id);
    const selected = Number.isInteger(entry.choice) ? entry.choice : null;
    const correct = selected === unit.checkpoint.correct;
    return `<section class="learning-checkpoint" id="learning-checkpoint" aria-labelledby="checkpoint-title"><span class="session-label">Check your reasoning</span><h2 id="checkpoint-title">One-minute checkpoint</h2><fieldset><legend>${esc(unit.checkpoint.question)}</legend><div class="checkpoint-options">${unit.checkpoint.options.map((option, index) => `<button class="checkpoint-option${selected === index ? correct ? ' is-correct' : ' is-incorrect' : ''}" type="button" data-action="learn-check" data-unit="${unit.id}" data-choice="${index}" aria-pressed="${selected === index}"><span class="checkpoint-letter" aria-hidden="true">${String.fromCharCode(65 + index)}</span>${esc(option)}</button>`).join('')}</div></fieldset><div class="checkpoint-feedback" role="status">${selected !== null ? `<strong>${correct ? '✓ Checkpoint cleared' : 'Not quite. You can try another option.'}</strong><p>${esc(unit.checkpoint.explanations[selected])}</p>${entry.passed && !correct ? '<small>You cleared this checkpoint earlier. That result remains saved.</small>' : ''}` : '<p>Choose the best answer. You can retry, and your result will be saved.</p>'}</div></section>`;
  }

  function toggleLearningDone(id) {
    const unit = courseUnits.find((item) => item.id === id);
    if (!unit) return;
    const entry = learningEntry(id);
    state.learning.entries[id] = { ...entry, completed: !entry.completed, completionUpdatedAt: Date.now() };
    saveState();
    if (!current.unitId) {
      renderLearningOverview();
      elements.main.querySelector(`[data-action="learn-done"][data-unit="${id}"]`)?.focus({ preventScroll: true });
    } else {
      document.querySelectorAll(`[data-action="learn-done"][data-unit="${id}"]`).forEach((button) => {
        button.classList.toggle('is-done', !entry.completed);
        button.setAttribute('aria-pressed', String(!entry.completed));
        button.setAttribute('aria-label', `${entry.completed ? 'Mark read' : 'Mark unread'}: ${unit.title}`);
        button.textContent = entry.completed ? 'Mark read' : '✓ Read';
      });
    }
    renderFieldLog();
    announce(`${unit.title}: ${entry.completed ? 'marked unread' : 'marked read'}`);
  }

  function answerLearningCheckpoint(id, choice) {
    const unit = courseUnits.find((item) => item.id === id);
    if (!unit || !Number.isInteger(choice) || choice < 0 || choice >= unit.checkpoint.options.length) return;
    const entry = learningEntry(id);
    const correct = choice === unit.checkpoint.correct;
    state.learning.entries[id] = { ...entry, choice, passed: entry.passed || correct, attempts: entry.attempts + 1, checkpointUpdatedAt: Date.now() };
    saveState();
    document.querySelector('#learning-checkpoint').outerHTML = renderLearningCheckpoint(unit);
    elements.main.querySelector(`[data-action="learn-check"][data-choice="${choice}"]`)?.focus({ preventScroll: true });
    const meta = document.querySelector('.lesson-toolbar > span');
    if (meta) meta.textContent = `${unit.minutes} min read · ${learningEntry(id).passed ? '✓ Checkpoint cleared' : 'One checkpoint'}`;
    renderFieldLog();
    announce(unit.checkpoint.explanations[choice]);
  }

  function rankingMetrics(order) {
    const grades = [3, 2, 1, 0];
    const dcg = order.slice(0, 3).reduce((sum, item, index) => sum + (2 ** grades[item] - 1) / Math.log2(index + 2), 0);
    const ideal = [0, 1, 2, 3].slice(0, 3).reduce((sum, item, index) => sum + (2 ** grades[item] - 1) / Math.log2(index + 2), 0);
    const relevant = order.slice(0, 3).filter((item) => grades[item] >= 2).length;
    const first = order.findIndex((item) => grades[item] >= 2);
    return { ndcg: dcg / ideal, precision: relevant / 3, recall: relevant / 2, reciprocalRank: first < 0 ? 0 : 1 / (first + 1) };
  }

  function contentMatches(interest) {
    const outdoorWeight = Math.max(0, Math.min(100, interest)) / 100;
    return [
      { name: 'Trail Atlas', outdoor: 0.9, productivity: 0.1 },
      { name: 'Task Board', outdoor: 0.2, productivity: 0.95 },
      { name: 'Travel Journal', outdoor: 0.65, productivity: 0.65 },
      { name: 'Weather Window', outdoor: 0.8, productivity: 0.25 }
    ].map((item) => ({ ...item, score: outdoorWeight * item.outdoor + (1 - outdoorWeight) * item.productivity }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  function renderContentMatches() {
    return contentMatches(contentInterest).map((item, index) => `<li><span class="rank-position">${index + 1}</span><span><strong>${item.name}</strong><small>Features: outdoor ${item.outdoor.toFixed(2)}, productivity ${item.productivity.toFixed(2)}</small></span><span class="content-score">${item.score.toFixed(3)}</span></li>`).join('');
  }

  function renderContentLab() {
    return `<section class="ranking-lab" id="content-lab" aria-labelledby="content-lab-title"><span class="session-label">Try it yourself</span><h2 id="content-lab-title">Change a profile, change the recommendations</h2><p>These fictional apps have two fixed content features. Adjust the user profile to see a simple weighted dot product reorder them.</p><label class="content-interest-caption" for="content-interest">Outdoor interest weight <output id="content-interest-label" for="content-interest">${contentInterest}% outdoor · ${100 - contentInterest}% productivity</output></label><input id="content-interest" type="range" min="0" max="100" step="10" value="${contentInterest}"><ol class="rank-items content-match-results" id="content-match-results" aria-live="polite">${renderContentMatches()}</ol><p class="draft-hint">Score = outdoorWeight × outdoorFeature + productivityWeight × productivityFeature. These hand-chosen features are not trained embeddings, measured preferences, or conversion probabilities. This exercise does not save or grade your profile.</p></section>`;
  }

  function renderLessonTable(table) {
    return `<div class="lesson-table-wrap" role="region" aria-label="${escAttribute(table.caption)}" tabindex="0"><table class="lesson-table"><caption>${esc(table.caption)}</caption><thead><tr>${table.headers.map((header) => `<th scope="col">${esc(header)}</th>`).join('')}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderPipelineExplorer(unit) {
    const selected = Math.min(pipelineStage, unit.pipeline.length - 1);
    return `<section class="ranking-lab pipeline-explorer" id="pipeline-explorer" aria-labelledby="pipeline-title"><span class="session-label">Follow one event</span><h2 id="pipeline-title">The ingestion path</h2><p>Select a stage to see its responsibility. This ordered path is illustrative; historical and online consumers can branch from validated data.</p><ol class="pipeline-steps">${unit.pipeline.map((stage, index) => `<li><button class="pipeline-step${selected === index ? ' is-active' : ''}" type="button" data-action="pipeline-stage" data-stage="${index}" aria-pressed="${selected === index}" aria-controls="pipeline-detail"><span>${index + 1}</span>${esc(stage.name)}</button></li>`).join('')}</ol><div class="pipeline-detail" id="pipeline-detail"><h3>${selected + 1}. ${esc(unit.pipeline[selected].name)}</h3><p>${esc(unit.pipeline[selected].detail)}</p></div><p class="draft-hint">Stage selection is not saved or graded. The example does not start or configure external services.</p></section>`;
  }

  function selectPipelineStage(index) {
    const unit = courseUnits.find((item) => item.id === current.unitId);
    if (!unit?.pipeline || !Number.isInteger(index) || index < 0 || index >= unit.pipeline.length) return;
    pipelineStage = index;
    document.querySelector('#pipeline-explorer').outerHTML = renderPipelineExplorer(unit);
    document.querySelector(`[data-action="pipeline-stage"][data-stage="${index}"]`)?.focus({ preventScroll: true });
    announce(`${unit.pipeline[index].name}: ${unit.pipeline[index].detail}`);
  }

  function capacityEstimate(input) {
    const { arrival, workers, perWorker, backlog, partitions } = input;
    if (![arrival, workers, perWorker, backlog, partitions].every(Number.isFinite)
      || arrival < 0 || backlog < 0 || perWorker <= 0 || !Number.isInteger(workers) || workers < 1
      || !Number.isInteger(partitions) || partitions < 1) {
      return { error: 'Enter non-negative arrival and backlog values, positive service rate, and positive whole numbers for workers and partitions.' };
    }
    const effectiveWorkers = Math.min(workers, partitions);
    const capacity = effectiveWorkers * perWorker;
    const spare = capacity - arrival;
    return {
      effectiveWorkers, capacity, spare,
      offeredLoad: arrival / capacity,
      growingBy: Math.max(0, -spare),
      drainSeconds: backlog === 0 ? 0 : spare > 0 ? backlog / spare : null,
      targetWorkers: Math.max(1, Math.ceil(arrival / (perWorker * 0.7))),
      partitionLimited: workers > partitions
    };
  }

  function renderCapacityResults() {
    const result = capacityEstimate(capacityInputs);
    if (result.error) return `<p class="capacity-warning">${esc(result.error)}</p>`;
    return `<dl class="rank-metrics capacity-metrics"><div><dt>Effective capacity</dt><dd data-capacity-result="capacity">${result.capacity.toLocaleString()} events/s</dd></div><div><dt>Offered load / capacity</dt><dd>${(result.offeredLoad * 100).toFixed(1)}%</dd></div><div><dt>Backlog drain time</dt><dd data-capacity-result="drain">${result.drainSeconds === null ? 'Cannot drain' : `${result.drainSeconds.toFixed(1)} s`}</dd></div><div><dt>Workers for 70% target load</dt><dd>${result.targetWorkers} <small>(also needs ≥${result.targetWorkers} usable partitions)</small></dd></div></dl><p class="capacity-warning">${result.growingBy > 0 ? `Overloaded: backlog grows by ${result.growingBy.toLocaleString()} events/s at this constant arrival rate.` : result.spare === 0 ? 'Saturated: no spare capacity to drain an existing backlog while arrivals continue.' : `Spare capacity: ${result.spare.toLocaleString()} events/s under the ideal assumptions.`}${result.partitionLimited ? ` Partition-limited: only ${result.effectiveWorkers} of ${capacityInputs.workers} workers have useful partition-processing parallelism in this example.` : ''}</p>`;
  }

  function renderCapacityLab() {
    return `<section class="ranking-lab" id="capacity-lab" aria-labelledby="capacity-title"><span class="session-label">Try the capacity arithmetic</span><h2 id="capacity-title">Can this pipeline keep up?</h2><p>Change arrivals, workers, partitions, and service rate. The toy model assumes a conventional partition-assigned consumer group, one sequential worker stream per partition, balanced keys, constant rates, and no shared sink bottleneck.</p><div class="capacity-inputs">${[
      ['arrival', 'Arrival rate (events/s)', 0], ['workers', 'Consumer workers', 1], ['partitions', 'Usable partitions', 1], ['perWorker', 'Measured rate per worker (events/s)', 1], ['backlog', 'Current backlog (events)', 0]
    ].map(([key, label, min]) => `<label for="capacity-${key}">${label}<input id="capacity-${key}" type="number" inputmode="numeric" min="${min}" step="1" value="${capacityInputs[key]}" data-capacity="${key}"></label>`).join('')}</div><div id="capacity-results" aria-live="polite" aria-atomic="true">${renderCapacityResults()}</div><p class="draft-hint">Drain time = backlog / (effective capacity − continuing arrivals), when spare capacity is positive. 70% is an illustrative headroom target, not a sizing rule. Real tests must include skew, I/O, batching, failures, and variable traffic. Inputs are not saved and nothing is provisioned.</p></section>`;
  }

  function renderRankingLab() {
    const names = ['Trail Atlas', 'Trek Planner', 'Hike Notes', 'Photo Studio'];
    const grades = [3, 2, 1, 0];
    const metrics = rankingMetrics(rankingOrder);
    return `<section class="ranking-lab" id="ranking-lab" aria-labelledby="ranking-lab-title"><span class="session-label">Try it yourself</span><h2 id="ranking-lab-title">Make a better ranked list</h2><p>Query: <strong>offline hiking maps</strong>. Move these fictional apps and watch the metrics. Grades are fixed toy judgments, not scores predicted by a model.</p><ol class="rank-items">${rankingOrder.map((item, index) => `<li><span class="rank-position">${index + 1}</span><span><strong>${names[item]}</strong><small>Relevance grade ${grades[item]} of 3</small></span><div><button class="icon-button" type="button" data-action="rank-move" data-index="${index}" data-direction="-1" aria-label="Move ${names[item]} up"${index === 0 ? ' disabled' : ''}>↑</button><button class="icon-button" type="button" data-action="rank-move" data-index="${index}" data-direction="1" aria-label="Move ${names[item]} down"${index === 3 ? ' disabled' : ''}>↓</button></div></li>`).join('')}</ol><dl class="rank-metrics"><div><dt>NDCG@3</dt><dd>${metrics.ndcg.toFixed(3)}</dd></div><div><dt>Reciprocal rank</dt><dd>${metrics.reciprocalRank.toFixed(3)}</dd></div><div><dt>Precision@3</dt><dd>${metrics.precision.toFixed(3)}</dd></div><div><dt>Recall@3</dt><dd>${metrics.recall.toFixed(3)}</dd></div></dl><p class="draft-hint">Binary metrics treat grades 2–3 as relevant; NDCG uses all grades with gain 2^grade − 1. Recall uses all four judged apps. Reciprocal rank uses the full list; MRR would average it over multiple queries. Exercise order is not saved or graded.</p></section>`;
  }

  function moveRankingItem(index, direction) {
    const next = index + direction;
    if (![1, -1].includes(direction) || index < 0 || index >= rankingOrder.length || next < 0 || next >= rankingOrder.length) return;
    [rankingOrder[index], rankingOrder[next]] = [rankingOrder[next], rankingOrder[index]];
    document.querySelector('#ranking-lab').outerHTML = renderRankingLab();
    const directionAfterMove = next === 0 ? 1 : next === rankingOrder.length - 1 ? -1 : direction;
    elements.main.querySelector(`[data-action="rank-move"][data-index="${next}"][data-direction="${directionAfterMove}"]`)?.focus({ preventScroll: true });
    announce(`Order changed. NDCG at three is ${rankingMetrics(rankingOrder).ndcg.toFixed(3)}.`);
  }

  function renderHome() {
    const next = getNextQuestion();
    const nextTopic = next ? topicById(next.topicId) : guide.topics[0];
    const dueCount = getDueQuestions().length;
    const activity = getWeekActivity();

    elements.main.innerHTML = `
      <div class="workspace-inner">
        <header class="page-header">
          <div>
            <h1>Build your ML understanding, one topic at a time.</h1>
            <p>Work the next useful question, rate your recall honestly, and let the trail adapt.</p>
          </div>
          <time class="today-date" datetime="${dateKey()}">${formatLongDate(new Date())}</time>
        </header>

        <section class="next-session" aria-labelledby="next-session-title">
          <div class="next-session-content">
            <span class="session-label">Your next move</span>
            <h2 id="next-session-title">${dueCount ? `${dueCount} review${dueCount === 1 ? '' : 's'} ready` : `Continue ${esc(nextTopic.title)}`}</h2>
            <p>${dueCount ? 'Start with questions that are due, then move into unseen material.' : 'Your review queue is clear. Build the next section of the skill trail.'}</p>
            <div class="next-meta">
              <span>${guide.questions.length} total questions</span>
              <span>${masteredCount()} mastered</span>
              <span>About 12 minutes</span>
            </div>
            <button class="primary-button" type="button" data-action="quick-practice">Start focused practice <kbd>10</kbd></button>
          </div>
        </section>

        <section class="learning-invite" aria-labelledby="learning-invite-title">
          <div><span class="session-label">Applied ML track</span><h2 id="learning-invite-title">From ML concepts to working systems</h2><p>Three guided modules: Search, Recommendations, and ML in Production.</p></div>
          <button class="secondary-button" type="button" data-view="learn">Enter learning room →</button>
        </section>

        <div class="home-rhythm">
          <section class="daily-track" aria-labelledby="activity-title">
            <h2 id="activity-title">This week's rhythm</h2>
            <p>${activeDaysThisWeek()} active day${activeDaysThisWeek() === 1 ? '' : 's'}. Every useful review counts.</p>
            <div class="day-strip">${activity.map(renderDayCell).join('')}</div>
          </section>

          <section class="challenge-invite" aria-labelledby="challenge-title">
            <div>
              <span class="challenge-glyph" aria-hidden="true">⚑</span>
              <h3 id="challenge-title">Mixed challenge</h3>
              <p>Ten questions from your weakest and newest topics. Build a clean recall combo.</p>
            </div>
            <button class="text-button" type="button" data-action="challenge">Begin challenge</button>
          </section>
        </div>

        <section class="trail-overview" aria-labelledby="trail-title">
          <h2 id="trail-title">Your skill trail</h2>
          <p>Follow the foundations-first sequence, or open any topic when you need it.</p>
          ${guide.priorities.map(renderPriorityBand).join('')}
        </section>
      </div>`;
  }

  function renderDayCell(day) {
    return `
      <div class="day-cell${day.active ? ' is-active' : ''}${day.today ? ' is-today' : ''}" aria-label="${day.label}, ${day.count} questions reviewed">
        <strong>${day.short}</strong>
        <span class="day-mark" aria-hidden="true"></span>
        <span>${day.count || '0'}</span>
      </div>`;
  }

  function renderPriorityBand(priority) {
    const topics = priority.topics.map(topicById).filter(Boolean);
    const questions = topics.flatMap(topicQuestions);
    const progress = percentMastered(questions);
    return `
      <div class="priority-band">
        <div class="priority-summary">
          <strong>Priority ${priority.number}</strong>
          <span>${esc(priority.title)}</span>
          <div class="priority-progress" aria-label="${progress}% mastered"><span style="--progress:${progress}%"></span></div>
        </div>
        <div class="topic-lines">
          ${topics.map((topic) => {
            const topicQs = topicQuestions(topic);
            const topicProgress = percentMastered(topicQs);
            return `
              <button class="topic-line" type="button" data-action="topic" data-topic="${topic.id}">
                <span class="topic-line-title">${topic.number}. ${esc(topic.title)}</span>
                <span class="topic-line-count">${topicQs.length} questions</span>
                <span class="topic-line-score">${topicProgress}%</span>
              </button>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderTrail() {
    elements.trail.innerHTML = guide.priorities.map((priority) => {
      const collapsed = collapsedPriorities.has(priority.id);
      return `
        <div class="priority-group${collapsed ? ' is-collapsed' : ''}">
          <button class="priority-toggle" type="button" data-action="priority-toggle" data-priority="${priority.id}" aria-expanded="${!collapsed}">
            Priority ${priority.number}: ${esc(priority.title)}
            <span class="priority-chevron" aria-hidden="true">⌄</span>
          </button>
          <div class="priority-topics">
            ${priority.topics.map((topicId) => {
              const topic = topicById(topicId);
              const progress = percentMastered(topicQuestions(topic));
              const started = topicQuestions(topic).some((q) => reviewFor(q.id).attempts > 0);
              return `
                <button class="trail-topic${started ? ' is-started' : ''}${progress === 100 ? ' is-complete' : ''}${current.topicId === topic.id ? ' is-active' : ''}" type="button" data-action="topic" data-topic="${topic.id}" title="${esc(topic.title)}">
                  <span class="topic-node">${progress === 100 ? '✓' : topic.number}</span>
                  <span class="trail-topic-title">${esc(topic.title)}</span>
                  <span class="trail-percent">${progress}%</span>
                </button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  }

  function togglePriority(priorityId) {
    if (collapsedPriorities.has(priorityId)) collapsedPriorities.delete(priorityId);
    else collapsedPriorities.add(priorityId);
    renderTrail();
  }

  function renderTopic() {
    const topic = topicById(current.topicId);
    if (!topic) {
      navigate('home');
      return;
    }
    const questions = topicQuestions(topic);
    const progress = percentMastered(questions);
    const attempted = questions.filter((q) => reviewFor(q.id).attempts > 0).length;
    const completed = questions.filter((q) => isQuestionDone(q.id)).length;
    const due = questions.filter(isDue).length;

    elements.main.innerHTML = `
      <div class="workspace-inner">
        <button class="back-button" type="button" data-view="home">← <span>Back to today</span></button>
        <header class="topic-header">
          <div>
            <span class="section-label">Topic ${topic.number}, ${esc(priorityById(topic.priorityId)?.title || '')}</span>
            <h1>${esc(topic.title)}</h1>
            <p>${completed} of ${questions.length} questions done, ${attempted} practiced${due ? `, ${due} due for review` : ''}.</p>
          </div>
          <div class="progress-dial" style="--value:${progress}%" role="img" aria-label="${progress}% mastered"><strong>${progress}%</strong></div>
        </header>
        <div class="topic-actions">
          <button class="primary-button" type="button" data-action="start-topic" data-topic="${topic.id}">${attempted ? 'Continue topic' : 'Start topic'}</button>
          <button class="secondary-button" type="button" data-action="challenge">Mix into challenge</button>
        </div>
        <section class="topic-overview" aria-labelledby="question-index-title">
          <h2 id="question-index-title">Question index</h2>
          <p>Open a question to practice, or mark it done here. Click Done to undo.</p>
          <div class="question-index-list">
            ${questions.map(renderQuestionIndexRow).join('')}
          </div>
        </section>
      </div>`;
  }

  function renderQuestionIndexRow(question) {
    const status = masteryStatus(question.id);
    return `
      <div class="question-index-row">
        <button class="question-open-button" type="button" data-action="open-question" data-question="${question.id}">
        <span class="question-index-number">Q${question.number}</span>
        <span class="question-index-title">${renderInline(question.prompt)}</span>
        <span class="question-index-note" aria-label="${state.notes[question.id] ? 'Has a note' : state.bookmarks.includes(question.id) ? 'Saved' : ''}">${state.notes[question.id] ? '✎' : state.bookmarks.includes(question.id) ? '◇' : ''}</span>
        <span class="status-pill ${status.className}">${status.label}</span>
        </button>
        ${renderCompletionButton(question)}
      </div>`;
  }

  function renderCompletionButton(question) {
    const done = isQuestionDone(question.id);
    return `<button class="completion-button${done ? ' is-done' : ''}" type="button"
      data-action="toggle-done" data-question="${question.id}" aria-pressed="${done}"
      aria-label="${done ? 'Undo completion for' : 'Mark done:'} ${escAttribute(question.prompt)}"
      title="${done ? 'Click to undo completion' : 'Record Easy recall and mark mastered'}">${done ? '✓ Done' : 'Mark done'}</button>`;
  }

  function toggleQuestionDone(questionId) {
    if (!questionById(questionId)) return;
    const completed = !isQuestionDone(questionId);
    let points = 0;
    if (completed) {
      const session = current.view === 'practice' && getCurrentQuestion()?.id === questionId ? current.session : null;
      points = recordRecall(questionId, 'easy', { session, completion: true });
    } else {
      const review = { ...reviewFor(questionId) };
      const now = Date.now();
      review.mastery = review.completionUndo?.mastery ?? 0;
      review.dueAt = review.completionUndo?.dueAt ?? 0;
      review.completed = false;
      review.completionUpdatedAt = now;
      review.updatedAt = now;
      delete review.completionUndo;
      state.reviews[questionId] = review;
    }
    saveState();
    const scrollPosition = window.scrollY;
    renderMain();
    updateSidebarAfterProgress();
    const completionButton = elements.main.querySelector(`[data-action="toggle-done"][data-question="${questionId}"]`);
    (completionButton || document.querySelector('#library-search') || elements.main).focus({ preventScroll: true });
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    showToast(completed ? `Easy recall recorded, +${points} XP` : 'Completion undone', completed ? 'success' : '');
  }

  function renderLibrary(preserveFocus = false) {
    const priorSelection = preserveFocus ? document.querySelector('#library-search')?.selectionStart : null;
    const source = current.view === 'saved'
      ? guide.questions.filter((q) => state.bookmarks.includes(q.id))
      : guide.questions;
    const normalized = current.search.trim().toLowerCase();
    const results = source.filter((question) => {
      const review = reviewFor(question.id);
      const matchesQuery = !normalized || `${question.prompt} ${topicById(question.topicId)?.title} ${question.answer}`.toLowerCase().includes(normalized);
      const matchesFilter = current.filter === 'all'
        || (current.filter === 'unseen' && review.attempts === 0 && !isQuestionDone(question.id))
        || (current.filter === 'done' && isQuestionDone(question.id))
        || (current.filter === 'learning' && review.attempts > 0 && review.mastery < 3)
        || (current.filter === 'mastered' && review.mastery >= 3)
        || (current.filter === 'due' && isDue(question));
      return matchesQuery && matchesFilter;
    });

    const title = current.view === 'saved' ? 'Saved questions' : 'Question library';
    const description = current.view === 'saved'
      ? 'Your bookmarked prompts and personal notes, ready for another pass.'
      : 'Search every prompt and answer, then jump straight into active recall.';

    elements.main.innerHTML = `
      <div class="workspace-inner library-section">
        <header class="page-header">
          <div><h1>${title}</h1><p>${description}</p></div>
        </header>
        <div class="library-controls">
          <div class="search-wrap">
            <label class="visually-hidden" for="library-search">Search questions and answers</label>
            <input class="search-input" id="library-search" type="search" value="${escAttribute(current.search)}" placeholder="Search concepts, algorithms, or phrases" autocomplete="off">
          </div>
          <div class="filter-row" aria-label="Filter questions">
            ${['all', 'unseen', 'done', 'learning', 'due', 'mastered'].map((filter) => `
              <button class="chip-button${current.filter === filter ? ' is-active' : ''}" type="button" data-action="set-filter" data-filter="${filter}">${capitalize(filter)}</button>
            `).join('')}
            ${current.view === 'saved' && source.length ? '<button class="chip-button" type="button" data-action="practice-saved">Practice saved</button>' : ''}
          </div>
          <div class="library-count">${results.length} of ${source.length} questions</div>
        </div>
        ${results.length ? `<div class="question-index-list">${results.map(renderLibraryRow).join('')}</div>` : renderLibraryEmpty()}
      </div>`;

    if (preserveFocus) {
      const input = document.querySelector('#library-search');
      input?.focus();
      if (priorSelection !== null) input?.setSelectionRange(priorSelection, priorSelection);
    }
  }

  function renderSaved() {
    renderLibrary();
  }

  function renderLibraryRow(question) {
    const topic = topicById(question.topicId);
    const status = masteryStatus(question.id);
    return `
      <div class="question-index-row">
        <button class="question-open-button" type="button" data-action="open-question" data-question="${question.id}">
        <span class="question-index-number">${topic.number}.${question.number}</span>
        <span class="question-index-title">${renderInline(question.prompt)}<small class="question-index-topic">${esc(topic.title)}</small></span>
        <span class="question-index-note">${state.notes[question.id] ? '✎' : state.bookmarks.includes(question.id) ? '◇' : ''}</span>
        <span class="status-pill ${status.className}">${status.label}</span>
        </button>
        ${renderCompletionButton(question)}
      </div>`;
  }

  function renderLibraryEmpty() {
    const isSaved = current.view === 'saved' && state.bookmarks.length === 0;
    return `
      <div class="empty-state">
        <span class="empty-symbol" aria-hidden="true">${isSaved ? '◇' : '⌕'}</span>
        <h2>${isSaved ? 'No saved questions yet' : 'No questions match'}</h2>
        <p>${isSaved ? 'Save any question during practice to build a personal review set.' : 'Try a different phrase or remove one of the filters.'}</p>
        ${isSaved ? '<button class="primary-button" type="button" data-action="quick-practice">Start practice</button>' : ''}
      </div>`;
  }

  function setLibraryFilter(filter) {
    current.filter = filter;
    renderLibrary();
  }

  function startQuickPractice() {
    const queue = buildQueue(guide.questions, MAX_SESSION);
    startSession(queue, 'focus', 'Focused practice');
  }

  function startTopicPractice(topicId) {
    const topic = topicById(topicId);
    if (!topic) return;
    startSession(buildQueue(topicQuestions(topic), MAX_SESSION), 'topic', topic.title, topic.id);
  }

  function startSavedPractice() {
    const saved = guide.questions.filter((q) => state.bookmarks.includes(q.id));
    if (!saved.length) return;
    startSession(buildQueue(saved, MAX_SESSION), 'saved', 'Saved questions');
  }

  function startChallenge() {
    const candidate = [...guide.questions].sort((a, b) => {
      const scoreA = challengePriority(a) + Math.random() * 0.8;
      const scoreB = challengePriority(b) + Math.random() * 0.8;
      return scoreA - scoreB;
    });
    startSession(candidate.slice(0, MAX_SESSION), 'challenge', 'Mixed challenge');
  }

  function openQuestion(questionId) {
    const question = questionById(questionId);
    if (!question) return;
    const topic = topicById(question.topicId);
    const questions = topicQuestions(topic);
    startSession(questions, 'topic', topic.title, topic.id, questions.findIndex((item) => item.id === question.id));
  }

  function startSession(queue, mode, label, topicId = null, startIndex = 0) {
    if (!queue.length) return;
    leaveLearningLocation();
    clearTimeout(advanceTimer);
    current.view = 'practice';
    current.topicId = topicId;
    current.session = {
      mode,
      label,
      topicId,
      queue: queue.map((q) => q.id),
      index: startIndex,
      questionStates: {},
      revealed: false,
      noteOpen: false,
      attempt: '',
      combo: 0,
      bestCombo: 0,
      ratings: [],
      xpEarned: 0,
      finished: false,
      credited: new Set()
    };
    setMenuOpen(false);
    updateNav();
    renderPractice();
    renderFieldLog();
    scrollMainToTop();
  }

  function restartCurrentSession() {
    const previous = current.session;
    if (!previous) return;
    const pool = previous.topicId ? topicQuestions(topicById(previous.topicId)) : guide.questions;
    if (previous.mode === 'challenge') startChallenge();
    else startSession(buildQueue(pool, MAX_SESSION), previous.mode, previous.label, previous.topicId);
  }

  function buildQueue(pool, limit) {
    const now = Date.now();
    return [...pool]
      .map((question, index) => ({ question, score: queuePriority(question, now) + index / 100000 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, Math.min(limit, pool.length))
      .map((item) => item.question);
  }

  function queuePriority(question, now = Date.now()) {
    const review = reviewFor(question.id);
    if (review.attempts > 0 && review.dueAt <= now) return 0;
    if (review.attempts === 0) return isQuestionDone(question.id) ? 3 : 1;
    if (review.mastery < 3) return 2 + review.mastery * 0.1;
    return 4 + review.dueAt / 1e15;
  }

  function challengePriority(question) {
    const review = reviewFor(question.id);
    if (isDue(question)) return 0;
    if (!review.attempts) return 1;
    if (review.mastery < 3) return 2 + review.mastery * 0.1;
    return 4;
  }

  function renderPractice() {
    const session = current.session;
    if (!session) {
      navigate('home');
      return;
    }
    if (session.finished) {
      renderSessionResult();
      return;
    }

    const question = getCurrentQuestion();
    const topic = topicById(question.topicId);
    const status = masteryStatus(question.id);
    const saved = state.bookmarks.includes(question.id);
    const note = state.notes[question.id] || '';
    const progress = Math.round((session.index / session.queue.length) * 100);

    elements.main.innerHTML = `
      <div class="practice-shell">
        ${session.mode === 'challenge' ? renderChallengeBanner(session) : ''}
        <div class="practice-toolbar">
          <button class="back-button" type="button" data-action="back">← <span>Leave session</span></button>
          <div class="practice-location">
            <strong>${esc(session.label)}</strong>
            <span>${session.index + 1} of ${session.queue.length}, ${esc(topic.title)}</span>
            <div class="question-progress-track" aria-label="${progress}% through session"><span style="width:${progress}%"></span></div>
          </div>
          <button class="bookmark-button${saved ? ' is-saved' : ''}" type="button" data-action="bookmark" data-question="${question.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved questions' : 'Save question'}">${saved ? '◆' : '◇'} <span>${saved ? 'Saved' : 'Save'}</span></button>
        </div>

        <nav class="question-navigation" aria-label="Question navigation">
          <button class="secondary-button" type="button" data-action="previous-question" ${session.index === 0 ? 'disabled' : ''}>← Prev</button>
          <button class="secondary-button" type="button" data-action="next-question" ${session.index === session.queue.length - 1 ? 'disabled' : ''}>Next →</button>
        </nav>

        <article class="question-stage">
          <div class="question-face">
            <div class="question-meta">
              <span class="question-number">Topic ${topic.number}, Q${question.number}</span>
              <span class="mastery-tag ${status.className}">${status.label}</span>
            </div>
            <h1 class="question-prompt">${renderInline(question.prompt)}</h1>
            <p class="think-prompt">Build your answer first. A few keywords are enough.</p>
            <label class="visually-hidden" for="attempt-input">Your answer notes</label>
            <textarea class="attempt-input" id="attempt-input" placeholder="Type what you remember, or answer aloud...">${esc(session.attempt)}</textarea>
            <div class="question-actions">
              ${session.revealed
                ? '<button class="secondary-button" type="button" data-action="skip">Next question</button>'
                : '<button class="primary-button" type="button" data-action="reveal">Reveal answer <kbd>Space</kbd></button><button class="secondary-button" type="button" data-action="skip">Skip for now</button>'}
              ${renderCompletionButton(question)}
              <span class="question-hint">Honest recall beats fast progress.</span>
            </div>
          </div>
          ${session.revealed ? renderAnswerFace(question, note) : ''}
        </article>
      </div>`;

    if (session.revealed) {
      requestAnimationFrame(() => document.querySelector('.answer-face')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }));
    }
  }

  function renderChallengeBanner(session) {
    return `
      <div class="challenge-banner">
        <strong>Challenge run</strong>
        <span>${session.combo ? `${session.combo} recall combo` : 'Build your combo'}</span>
        <div class="challenge-dots" aria-label="Question ${session.index + 1} of ${session.queue.length}">
          ${session.queue.map((_, index) => `<span class="challenge-dot${index < session.index ? ' is-done' : ''}${index === session.index ? ' is-current' : ''}"></span>`).join('')}
        </div>
      </div>`;
  }

  function renderAnswerFace(question, note) {
    return `
      <div class="answer-face">
        <div class="answer-label"><span aria-hidden="true">✓</span> Worked answer</div>
        <div class="answer-content">${renderMarkdown(question.answer)}</div>
        <div class="self-check">
          <h3>How did your answer compare?</h3>
          <p>Your rating schedules the next review and updates mastery.</p>
          <div class="rating-options">
            <button class="rating-button again" type="button" data-action="rate" data-rating="again"><kbd>1</kbd><span>Again<small>Review soon, +2 XP</small></span></button>
            <button class="rating-button got-it" type="button" data-action="rate" data-rating="got-it"><kbd>2</kbd><span>Got it<small>Good recall, +10 XP</small></span></button>
            <button class="rating-button easy" type="button" data-action="rate" data-rating="easy"><kbd>3</kbd><span>Easy<small>Strong recall, +14 XP</small></span></button>
          </div>
        </div>
        <div class="note-area">
          <button class="note-toggle" type="button" data-action="note-toggle">${note ? 'Edit personal note' : 'Add a personal note'}</button>
          ${current.session.noteOpen || note ? `<label class="visually-hidden" for="note-input">Personal note for this question</label><textarea class="note-input" id="note-input" placeholder="Add an example, mnemonic, or point to revisit...">${esc(note)}</textarea>` : ''}
        </div>
      </div>`;
  }

  function revealAnswer() {
    if (!current.session || current.session.revealed) return;
    current.session.revealed = true;
    current.session.attempt = document.querySelector('#attempt-input')?.value || '';
    renderPractice();
    announce('Answer revealed. Rate your recall with 1, 2, or 3.');
  }

  function toggleNoteArea() {
    if (!current.session) return;
    current.session.noteOpen = !current.session.noteOpen;
    renderPractice();
    if (current.session.noteOpen) requestAnimationFrame(() => document.querySelector('#note-input')?.focus());
  }

  function rateCurrentQuestion(rating) {
    const session = current.session;
    const question = getCurrentQuestion();
    if (!session || !question || !session.revealed) return;

    const oldLevel = levelInfo(state.xp).level;
    const points = recordRecall(question.id, rating, { session });
    saveState();

    const newLevel = levelInfo(state.xp).level;
    const label = rating === 'again' ? 'Scheduled for a quick retry' : rating === 'easy' ? 'Marked as strong recall' : 'Progress recorded';
    showToast(`${label}, +${points} XP`, rating !== 'again' ? 'success' : '');
    if (newLevel > oldLevel) setTimeout(() => showToast(`Level ${newLevel} unlocked: ${levelInfo(state.xp).title}`, 'success'), 350);

    updateSidebarAfterProgress();
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      if (current.session === session) advanceQuestion();
    }, reducedMotion() ? 20 : 420);
  }

  function recordRecall(questionId, rating, { session = null, now = Date.now(), completion = false } = {}) {
    const today = dateKey(new Date(now));
    const review = { ...reviewFor(questionId) };
    if (completion) review.completionUndo = { mastery: review.mastery, dueAt: review.dueAt };
    else delete review.completionUndo;
    const fullCredit = review.lastCreditDate !== today && !session?.credited.has(questionId);
    const basePoints = rating === 'again' ? 2 : rating === 'got-it' ? 10 : 14;
    const comboBonus = session?.mode === 'challenge' && rating !== 'again' ? Math.min(session.combo, 5) : 0;
    const points = fullCredit ? basePoints + comboBonus : 1;

    if (rating === 'again') {
      review.mastery = Math.max(0, review.mastery - 1);
      review.dueAt = now + 10 * 60 * 1000;
      if (session) session.combo = 0;
    } else if (rating === 'got-it') {
      review.mastery = Math.min(3, review.mastery + 1);
      const interval = [DAY, DAY, 3 * DAY, 7 * DAY][review.mastery];
      review.dueAt = now + interval;
      if (session) session.combo += 1;
    } else {
      review.mastery = 3;
      const previousStrength = review.attempts >= 2 ? 14 * DAY : 7 * DAY;
      review.dueAt = now + previousStrength;
      if (session) session.combo += 1;
    }

    review.attempts += 1;
    if (rating !== 'again') review.wins += 1;
    review.lastRating = rating;
    review.completed = true;
    review.completionUpdatedAt = now;
    review.lastReviewed = now;
    review.lastCreditDate = today;
    review.updatedAt = Date.now();
    state.reviews[questionId] = review;
    state.xp += points;
    if (session) {
      session.xpEarned += points;
      session.bestCombo = Math.max(session.bestCombo, session.combo);
      session.ratings.push(rating);
      session.credited.add(questionId);
    }

    const day = state.daily[today] || { questions: [], xp: 0 };
    if (!day.questions.includes(questionId)) day.questions.push(questionId);
    day.xp += points;
    state.daily[today] = day;
    return points;
  }

  function advanceQuestion() {
    const session = current.session;
    if (!session || session.finished) return;
    if (session.index >= session.queue.length - 1) {
      finishSession();
      return;
    }
    navigateQuestion(1);
  }

  function navigateQuestion(direction) {
    const session = current.session;
    if (!session || session.finished) return;
    const nextIndex = session.index + direction;
    if (nextIndex < 0 || nextIndex >= session.queue.length) return;
    clearTimeout(advanceTimer);
    advanceTimer = null;
    session.questionStates[session.queue[session.index]] = {
      attempt: document.querySelector('#attempt-input')?.value ?? session.attempt,
      revealed: session.revealed,
      noteOpen: session.noteOpen
    };
    session.index = nextIndex;
    const saved = session.questionStates[session.queue[session.index]];
    session.revealed = saved?.revealed || false;
    session.noteOpen = saved?.noteOpen || false;
    session.attempt = saved?.attempt || '';
    renderPractice();
    renderFieldLog();
    scrollMainToTop();
    announce(`Question ${session.index + 1} of ${session.queue.length}`);
  }

  function finishSession() {
    const session = current.session;
    if (!session) return;
    session.finished = true;

    if (session.mode === 'challenge') {
      state.completedChallenges += 1;
      const today = dateKey();
      if (state.lastChallengeBonus !== today) {
        state.xp += 25;
        session.xpEarned += 25;
        state.lastChallengeBonus = today;
        showToast('Daily challenge bonus, +25 XP', 'success');
      }
      saveState();
    }

    renderPractice();
    renderTrail();
    renderFieldLog();
    scrollMainToTop();
    announce('Session complete.');
  }

  function renderSessionResult() {
    const session = current.session;
    const recalled = session.ratings.filter((r) => r !== 'again').length;
    const accuracy = session.ratings.length ? Math.round((recalled / session.ratings.length) * 100) : 0;
    elements.main.innerHTML = `
      <div class="session-result">
        <div class="result-emblem" aria-hidden="true">${session.mode === 'challenge' ? '⚑' : '✓'}</div>
        <span class="session-label">Session complete</span>
        <h1>${session.mode === 'challenge' ? 'Challenge logged.' : 'Good work. Keep the signal.'}</h1>
        <p>${session.ratings.length ? 'Your ratings have updated the review queue. Weak answers will return sooner.' : 'No questions were rated this time. Start another round when you are ready.'}</p>
        <div class="result-stats">
          <div class="result-stat"><strong>${session.ratings.length}</strong><span>Rated</span></div>
          <div class="result-stat"><strong>${accuracy}%</strong><span>Recalled</span></div>
          <div class="result-stat"><strong>+${session.xpEarned}</strong><span>XP earned</span></div>
        </div>
        <div class="result-actions">
          <button class="primary-button" type="button" data-action="practice-again">Practice another set</button>
          <button class="secondary-button" type="button" data-action="finish-home">Return to today</button>
        </div>
      </div>`;
  }

  function goBackFromPractice() {
    const topicId = current.session?.topicId;
    if (topicId) openTopic(topicId);
    else navigate('home');
  }

  function getCurrentQuestion() {
    const id = current.session?.queue[current.session.index];
    return id ? questionById(id) : null;
  }

  function toggleBookmark(questionId) {
    const index = state.bookmarks.indexOf(questionId);
    if (index >= 0) {
      state.bookmarks.splice(index, 1);
      showToast('Removed from saved questions');
    } else {
      state.bookmarks.push(questionId);
      showToast('Saved for later', 'success');
    }
    saveState();
    if (current.view === 'practice') renderPractice();
    else if (current.view === 'saved') renderSaved();
    renderFieldLog();
  }

  function updateBookmarkAndNoteState(questionId) {
    const noteButton = document.querySelector(`[data-question="${questionId}"]`);
    if (noteButton && current.view !== 'practice') renderMain();
  }

  function renderFieldLog() {
    if (!guide.questions.length) return;
    const level = levelInfo(state.xp);
    const todayCount = state.daily[dateKey()]?.questions?.length || 0;
    const mastered = masteredCount();
    const due = getDueQuestions().length;
    const badges = getBadges();

    elements.fieldLog.innerHTML = `
      <section class="log-profile" aria-label="Current level">
        <div class="level-row">
          <div class="level-emblem">${level.level}</div>
          <div class="level-copy"><strong>${esc(level.title)}</strong><span>Level ${level.level}</span></div>
        </div>
        <div class="xp-track" aria-label="${level.progress}% to next level"><span style="width:${level.progress}%"></span></div>
        <div class="xp-caption"><span>${state.xp} XP</span><span>${level.toNext} to next</span></div>
      </section>
      ${renderSyncIndicator()}
      <section class="log-section">
        <div class="log-title">Today's goal <span>${Math.min(todayCount, DAILY_GOAL)}/${DAILY_GOAL}</span></div>
        <div class="goal-count"><strong>${todayCount}</strong><span>questions reviewed</span></div>
        <div class="goal-track" aria-label="${Math.min(100, Math.round(todayCount / DAILY_GOAL * 100))}% of daily goal"><span style="width:${Math.min(100, todayCount / DAILY_GOAL * 100)}%"></span></div>
      </section>
      <section class="log-section">
        <div class="log-title">Field log</div>
        <div class="stat-lines">
          <div class="stat-line"><span>Completed</span><strong>${completedCount()}/${guide.questions.length}</strong></div>
          <div class="stat-line"><span>Mastered</span><strong>${mastered}</strong></div>
          <div class="stat-line"><span>Ready to review</span><strong>${due}</strong></div>
          <div class="stat-line"><span>Active days</span><strong>${Object.keys(state.daily).length}</strong></div>
          <div class="stat-line"><span>Course units read</span><strong>${learningCompletedCount()}/${allCourseUnits.length}</strong></div>
          <div class="stat-line"><span>Checkpoints cleared</span><strong>${learningPassedCount()}/${allCourseUnits.length}</strong></div>
          ${current.session && !current.session.finished ? `<div class="stat-line"><span>Current combo</span><strong>${current.session.combo}</strong></div>` : ''}
        </div>
      </section>
      <section class="log-section">
        <div class="log-title">Milestones <span>${badges.filter((b) => b.earned).length}/${badges.length}</span></div>
        <div class="badge-row">
          ${badges.map((badge) => `<span class="mini-badge${badge.earned ? ' is-earned' : ''}" title="${escAttribute(badge.title)}: ${escAttribute(badge.description)}" aria-label="${badge.earned ? 'Earned' : 'Locked'}: ${escAttribute(badge.title)}">${badge.icon}</span>`).join('')}
        </div>
      </section>
      <section class="log-section">
        <div class="log-title">Practice keys</div>
        <div class="shortcuts">
          <div class="shortcut"><span>Reveal answer</span><kbd>Space</kbd></div>
          <div class="shortcut"><span>Again / Got it / Easy</span><span><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></span></div>
          <div class="shortcut"><span>Save question</span><kbd>S</kbd></div>
          <div class="shortcut"><span>Skip</span><kbd>→</kbd></div>
        </div>
      </section>`;
    elements.mobileLevel.textContent = `Level ${level.level}`;
  }

  function renderSyncIndicator() {
    const status = syncStatus === 'saving'
      ? { label: 'Saving progress', detail: 'Updating your study server', className: 'is-saving' }
      : syncStatus === 'offline'
        ? { label: 'Saved in this browser', detail: 'Server sync will retry next time', className: 'is-offline' }
        : { label: 'Progress saved', detail: lastServerSave ? `Server updated ${formatSaveTime(lastServerSave)}` : 'Available when you return', className: 'is-saved' };
    return `
      <section class="sync-indicator ${status.className}" aria-live="polite">
        <span class="sync-dot" aria-hidden="true"></span>
        <span><strong>${status.label}</strong><small>${status.detail}</small></span>
      </section>`;
  }

  function updateSyncIndicator() {
    const existing = elements.fieldLog.querySelector('.sync-indicator');
    if (existing) existing.outerHTML = renderSyncIndicator();
    const learningSync = elements.main.querySelector('#learning-sync');
    if (learningSync) learningSync.innerHTML = renderSyncIndicator();
  }

  function formatSaveTime(date) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function getBadges() {
    const attempted = attemptedCount();
    const mastered = masteredCount();
    const clearedTopic = guide.topics.some((topic) => percentMastered(topicQuestions(topic)) === 100);
    return [
      { icon: '✦', title: 'First recall', description: 'Rate your first answer', earned: attempted >= 1 },
      { icon: '10', title: 'Ten deep', description: 'Attempt 10 questions', earned: attempted >= 10 },
      { icon: '✓', title: 'Mastery set', description: 'Master 25 questions', earned: mastered >= 25 },
      { icon: '◎', title: 'Topic clear', description: 'Master a complete topic', earned: clearedTopic },
      { icon: '◫', title: 'Steady rhythm', description: 'Study on three different days', earned: Object.keys(state.daily).length >= 3 },
      { icon: '⚑', title: 'Challenger', description: 'Finish a mixed challenge', earned: state.completedChallenges >= 1 }
    ];
  }

  function updateSidebarAfterProgress() {
    renderTrail();
    renderFieldLog();
  }

  function updateNav() {
    document.querySelectorAll('[data-view]').forEach((button) => {
      const active = button.dataset.view === current.view || (current.view === 'topic' && button.dataset.view === 'home');
      button.classList.toggle('is-active', active);
    });
    if (current.view === 'practice') {
      document.querySelectorAll('[data-action="quick-practice"], [data-action="challenge"]').forEach((button) => {
        if (current.session?.mode === 'challenge' && button.dataset.action === 'challenge') button.classList.add('is-active');
        if (current.session?.mode !== 'challenge' && button.dataset.action === 'quick-practice') button.classList.add('is-active');
      });
    }
  }

  function reviewFor(questionId) {
    return state.reviews[questionId] || {
      mastery: 0,
      attempts: 0,
      wins: 0,
      dueAt: 0,
      lastRating: null,
      lastReviewed: null,
      lastCreditDate: null
    };
  }

  function masteryStatus(questionId) {
    const review = reviewFor(questionId);
    if (!review.attempts) return isQuestionDone(questionId)
      ? { label: 'Done', className: 'is-completed' }
      : { label: 'Unseen', className: '' };
    if (review.mastery >= 3) return { label: isDue({ id: questionId }) ? 'Review' : 'Mastered', className: 'is-mastered' };
    return { label: isDue({ id: questionId }) ? 'Due' : 'Learning', className: 'is-learning' };
  }

  function isDue(question) {
    const review = reviewFor(question.id);
    return review.attempts > 0 && review.dueAt <= Date.now();
  }

  function getDueQuestions() {
    return guide.questions.filter(isDue);
  }

  function getNextQuestion() {
    return buildQueue(guide.questions, 1)[0] || null;
  }

  function attemptedCount() {
    return guide.questions.filter((q) => reviewFor(q.id).attempts > 0).length;
  }

  function isQuestionDone(questionId) {
    const review = reviewFor(questionId);
    return typeof review.completed === 'boolean' ? review.completed : review.attempts > 0;
  }

  function completedCount() {
    return guide.questions.filter((q) => isQuestionDone(q.id)).length;
  }

  function masteredCount() {
    return guide.questions.filter((q) => reviewFor(q.id).mastery >= 3).length;
  }

  function percentMastered(questions) {
    if (!questions.length) return 0;
    const mastered = questions.filter((q) => reviewFor(q.id).mastery >= 3).length;
    return Math.round((mastered / questions.length) * 100);
  }

  function levelInfo(xp) {
    const titles = ['Warm start', 'Baseline builder', 'Bias breaker', 'Feature smith', 'Model tuner', 'Gradient climber', 'ML fluent'];
    const level = Math.floor(xp / LEVEL_SIZE) + 1;
    const within = xp % LEVEL_SIZE;
    return {
      level,
      title: titles[Math.min(level - 1, titles.length - 1)],
      progress: Math.round((within / LEVEL_SIZE) * 100),
      toNext: LEVEL_SIZE - within
    };
  }

  function getWeekActivity() {
    const days = [];
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - dayOfWeek);
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = dateKey(date);
      const count = state.daily[key]?.questions?.length || 0;
      days.push({
        label: date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
        short: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        count,
        active: count > 0,
        today: key === dateKey()
      });
    }
    return days;
  }

  function activeDaysThisWeek() {
    return getWeekActivity().filter((day) => day.active).length;
  }

  function topicById(id) {
    return guide.topics.find((topic) => topic.id === id);
  }

  function priorityById(id) {
    return guide.priorities.find((priority) => priority.id === id);
  }

  function questionById(id) {
    return guide.questions.find((question) => question.id === id);
  }

  function topicQuestions(topic) {
    if (!topic) return [];
    return topic.questions.map(questionById).filter(Boolean);
  }

  function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatLongDate(date) {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function renderMarkdown(markdown) {
    const lines = markdown.trim().split('\n');
    let html = '';
    let paragraph = [];
    let listType = null;
    let math = null;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      html += `<p>${renderInline(paragraph.join(' '))}</p>`;
      paragraph = [];
    };
    const closeList = () => {
      if (!listType) return;
      html += `</${listType}>`;
      listType = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (math !== null) {
        if (line === '\\]') {
          html += `<span class="formula-block">${esc(math.trim())}</span>`;
          math = null;
        } else {
          math += `${rawLine}\n`;
        }
        continue;
      }
      if (line === '\\[') {
        flushParagraph();
        closeList();
        math = '';
        continue;
      }
      if (!line) {
        flushParagraph();
        closeList();
        continue;
      }
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        const nextType = unordered ? 'ul' : 'ol';
        if (listType !== nextType) {
          closeList();
          listType = nextType;
          html += `<${listType}>`;
        }
        html += `<li>${renderInline((unordered || ordered)[1])}</li>`;
      } else {
        closeList();
        paragraph.push(line);
      }
    }
    flushParagraph();
    closeList();
    if (math !== null) html += `<span class="formula-block">${esc(math.trim())}</span>`;
    return html;
  }

  function renderInline(value) {
    return esc(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\\\((.+?)\\\)/g, '<span class="formula-inline">$1</span>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escAttribute(value) {
    return esc(value).replace(/\n/g, '&#10;');
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function showToast(message, kind = '') {
    const toast = document.createElement('div');
    toast.className = `toast${kind ? ` is-${kind}` : ''}`;
    toast.textContent = message;
    elements.toastRegion.append(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function announce(message) {
    elements.srStatus.textContent = '';
    requestAnimationFrame(() => { elements.srStatus.textContent = message; });
  }

  function setMenuOpen(open) {
    elements.studyRail.classList.toggle('is-open', open);
    elements.openMenu.setAttribute('aria-expanded', String(open));
    elements.railScrim.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function scrollMainToTop() {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    elements.main.focus({ preventScroll: true });
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function exportProgress() {
    const payload = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ml-gym-progress-${dateKey()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Progress exported', 'success');
  }

  function importProgress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || imported.version !== 1 || typeof imported.xp !== 'number') throw new Error('Invalid progress file');
        state = {
          ...normalizeState(imported),
          updatedAt: Date.now()
        };
        saveState();
        renderEverything();
        showToast('Progress imported', 'success');
      } catch {
        showToast('That file is not a valid ML Gym export');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    leaveLearningLocation();
    state = defaultState();
    state.resetAt = Date.now();
    state.updatedAt = state.resetAt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    scheduleServerSave(0);
    elements.resetConfirm.hidden = true;
    current = { view: 'home', topicId: null, search: '', filter: 'all', session: null };
    renderEverything();
    showToast('Progress erased from this browser and study server');
  }

  function renderLoadError(error) {
    elements.main.innerHTML = `
      <div class="empty-state">
        <span class="empty-symbol" aria-hidden="true">!</span>
        <h1>Study guide could not load</h1>
        <p>${esc(error.message)}. Start the site with <code>npm start</code> instead of opening index.html directly.</p>
      </div>`;
  }
})();
