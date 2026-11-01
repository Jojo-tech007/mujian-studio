/* =========================================================
   幕间 MIJIAN · 交互编排
   ========================================================= */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const app = $('#app');
  const STORAGE_KEY = 'mijian-story-room-v1';
  const THEME_KEY = 'mujian-theme-v03';
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    const button = document.getElementById('themeToggle');
    if (button) button.textContent = theme === 'light' ? '☾ 深色' : '☀ 浅色';
  }
  applyTheme((() => { try { return localStorage.getItem(THEME_KEY) || 'light'; } catch (_) { return 'light'; } })());

  const SCENE_SELECTION = {
    micro: [0, 2, 5],
    short: [0, 1, 3, 5],
    medium: [0, 1, 2, 3, 4, 5],
    long: [0, 1, 2, 3, 4, 5]
  };

  const ACT_WEIGHTS = [0.22, 0.48, 0.3];

  const ORBIT_VALUES = {
    micro: { value: '≤60', unit: 'SECONDS' },
    short: { value: '1–3', unit: 'MINUTES' },
    medium: { value: '3–5', unit: 'MINUTES' },
    long: { value: '5–10', unit: 'MINUTES' }
  };

  const state = {
    stage: 'setup',
    durationId: 'medium',
    genres: ['科幻', '悬疑'],
    tone: 'balanced',
    ideas: [],
    selectedId: null,
    outline: null,
    analysisTab: 'emotion',
    characterIndex: 0,
    production: null,
    productionTab: 'script',
    storyboardScene: 'all'
  };

  let posterSeq = 0;
  let chartSeq = 0;
  let portraitSeq = 0;
  let frameSeq = 0;
  let speakingVoiceIndex = null;
  let ideasToken = 0;
  let processToken = 0;
  let processMode = 'outline';
  let toastTimer = null;

  /* ---------------------------------------------------------
     small helpers
     --------------------------------------------------------- */

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function getDuration() {
    return DURATIONS.find((item) => item.id === state.durationId) || DURATIONS[2];
  }

  function getTone() {
    return TONES.find((item) => item.id === state.tone) || TONES[1];
  }

  function getSelectedIdea() {
    return state.ideas.find((item) => item.id === state.selectedId) || null;
  }

  function formatClock(totalSeconds) {
    const safe = Math.max(0, Math.round(totalSeconds));
    return `${Math.floor(safe / 60)}:${pad2(safe % 60)}`;
  }

  function formatDuration(totalSeconds) {
    const safe = Math.max(0, Math.round(totalSeconds));
    return `${Math.floor(safe / 60)}′${pad2(safe % 60)}″`;
  }

  function sceneCountFor(durationId) {
    return SCENE_SELECTION[durationId]?.length || 6;
  }

  function scoreValues(idea) {
    return {
      tension: clamp(idea.analysis.scores.tension, 0, 100),
      visual: clamp(idea.analysis.scores.visual, 0, 100),
      feasibility: clamp(idea.analysis.scores.feasibility, 0, 100),
      emotion: clamp(idea.analysis.scores.emotion, 0, 100)
    };
  }

  function showToast(message, duration = 2800) {
    const toast = $('#toast');
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
  }

  function setStage(stage) {
    state.stage = stage;
    document.body.dataset.stage = stage;
    updateTopbar();
  }

  function updateTopbar() {
    const order = ['setup', 'ideas', 'outline', 'production'];
    const currentIndex = order.indexOf(state.stage);
    $$('.stepper .step').forEach((step, index) => {
      const isActive = index === currentIndex;
      const isDone = index < currentIndex;
      step.classList.toggle('is-active', isActive);
      step.classList.toggle('is-done', isDone);
      if (isActive) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------------------------------------------------
     brief + idea selection
     --------------------------------------------------------- */

  function choosePack(genres) {
    let miracle = 0;
    let human = 0;
    const primary = genres[0];
    genres.forEach((genre) => {
      miracle += GENRE_WEIGHTS.miracle[genre] || 0;
      human += GENRE_WEIGHTS.human[genre] || 0;
    });
    // 主类型决定故事的「规则感」，给第一个题材额外权重。
    if (primary && GENRE_WEIGHTS.miracle[primary]) miracle += 3;
    if (primary && GENRE_WEIGHTS.human[primary]) human += 3;

    if (miracle === human) {
      const leansSpeculative = genres.some((genre) =>
        ['科幻', '悬疑', '惊悚', '国风', '冒险'].includes(genre)
      );
      return leansSpeculative ? 'miracle' : 'human';
    }
    return miracle > human ? 'miracle' : 'human';
  }

  function scoreForTone(idea, toneId) {
    const s = scoreValues(idea);
    if (toneId === 'emotion') {
      return s.emotion * 0.55 + s.tension * 0.25 + s.feasibility * 0.2;
    }
    if (toneId === 'genre') {
      return s.tension * 0.55 + s.visual * 0.2 + s.feasibility * 0.25;
    }
    return s.tension * 0.35 + s.emotion * 0.35 + s.visual * 0.15 + s.feasibility * 0.15;
  }

  function rankIdeas(pool) {
    return pool
      .map((idea, index) => {
        const matches = idea.genres.filter((genre) => state.genres.includes(genre)).length;
        const primaryMatch = state.genres[0] && idea.genres.includes(state.genres[0]) ? 1 : 0;
        return {
          idea,
          index,
          match: matches * 10 + primaryMatch * 3,
          score: scoreForTone(idea, state.tone)
        };
      })
      .sort((a, b) => b.match - a.match || b.score - a.score || a.index - b.index)
      .map((entry) => entry.idea);
  }

  function getRankedIdeas() {
    const packId = choosePack(state.genres);
    return rankIdeas(IDEAS.filter((idea) => idea.pack === packId));
  }

  function getPackMeta() {
    const packId = state.ideas[0]?.pack || choosePack(state.genres);
    return PACKS[packId] || PACKS.miracle;
  }

  function invalidateGenerated() {
    state.ideas = [];
    state.selectedId = null;
    state.outline = null;
    state.production = null;
    state.analysisTab = 'emotion';
    state.characterIndex = 0;
    state.productionTab = 'script';
    state.storyboardScene = 'all';
  }

  /* ---------------------------------------------------------
     setup screen
     --------------------------------------------------------- */

  function renderSetup() {
    ideasToken += 1;
    setStage('setup');
    const duration = getDuration();
    const tone = getTone();
    const orbit = ORBIT_VALUES[duration.id];
    const genreCount = state.genres.length;
    const sceneCount = sceneCountFor(duration.id);

    app.innerHTML = `
      <section class="setup-page">
        <div class="hero">
          <div class="eyebrow"><span class="dot"></span> STORY BRIEF / 01 · 从限制开始</div>
          <h1>先给故事一个边界，<br><em>再让它越界。</em></h1>
          <p class="lede">选定片长与题材。AI 会并行推演四个故事方向，并告诉你每个方向为什么成立、可能在哪里失手。你只需要决定：哪一个值得被写出来。</p>
          <div class="hero-stamp" aria-hidden="true">
            <span class="stamp-num">04</span>
            <small>DIRECTIONS<br>TO EXPLORE</small>
          </div>
        </div>

        <div class="setup-grid">
          <section class="brief-card" aria-labelledby="briefTitle">
            <div class="brief-head">
              <div>
                <span class="kicker">CREATIVE BRIEF</span>
                <h2 id="briefTitle">这次，想拍什么？</h2>
              </div>
              <span class="time-chip">
                <svg viewBox="0 0 14 14" width="11" height="11" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.2" stroke="currentColor" stroke-opacity=".6"/><path d="M7 4.2V7l1.9 1.1" stroke="currentColor" stroke-linecap="round"/></svg>
                约 20 秒
              </span>
            </div>

            <div class="field">
              <div class="field-head">
                <span class="field-num">01</span>
                <div class="field-title">
                  <h3>片长</h3>
                  <p>决定故事的呼吸频率，也决定它能装下几次转折。</p>
                </div>
                <span class="field-value" id="fieldDurationValue">${escapeHTML(duration.label)}</span>
              </div>
              <div class="duration-grid" role="group" aria-label="选择片长">
                ${DURATIONS.map((item) => `
                  <button
                    type="button"
                    class="duration-option${item.id === duration.id ? ' is-selected' : ''}"
                    data-duration="${item.id}"
                    aria-pressed="${item.id === duration.id}"
                  >
                    ${item.recommended ? '<span class="dur-badge">推荐</span>' : ''}
                    <span class="dur-label">${escapeHTML(item.label)}</span>
                    <span class="dur-desc">${escapeHTML(item.desc)}</span>
                    <span class="dur-check" aria-hidden="true"></span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="field">
              <div class="field-head">
                <span class="field-num">02</span>
                <div class="field-title">
                  <h3>题材</h3>
                  <p>最多选择三种。AI 会用主类型定规则，用副类型调情绪。</p>
                </div>
                <span class="field-value" id="fieldGenreValue">已选 ${genreCount} / 3</span>
              </div>
              <div class="genre-cloud" role="group" aria-label="选择题材">
                ${GENRES.map((genre) => {
                  const selected = state.genres.includes(genre.name);
                  const maxed = genreCount >= 3 && !selected;
                  return `
                    <button
                      type="button"
                      class="genre-chip${selected ? ' is-selected' : ''}${maxed ? ' is-maxed' : ''}"
                      data-genre="${escapeHTML(genre.name)}"
                      aria-pressed="${selected}"
                    >${escapeHTML(genre.name)}</button>
                  `;
                }).join('')}
              </div>
              <div class="genre-hint">
                <span class="hint-line"></span>
                <span>当前主类型：<strong id="primaryGenreText">${escapeHTML(state.genres[0] || '尚未选择')}</strong></span>
                <span>·</span>
                <span id="genreHintText">${state.genres.length >= 3 ? '已达到组合上限' : '可再选择 ' + (3 - state.genres.length) + ' 种'}</span>
              </div>
            </div>

            <div class="field">
              <div class="field-head">
                <span class="field-num">03</span>
                <div class="field-title">
                  <h3>叙事倾向</h3>
                  <p>不是类型，是 AI 做取舍时更偏向什么。</p>
                </div>
                <span class="field-value" id="fieldToneValue">${escapeHTML(tone.sub)}</span>
              </div>
              <div class="tone-grid" role="group" aria-label="选择叙事倾向">
                ${TONES.map((item) => `
                  <button type="button" class="tone-option${item.id === tone.id ? ' is-selected' : ''}" data-tone="${item.id}" aria-pressed="${item.id === tone.id}">
                    <strong>${escapeHTML(item.label)}</strong>
                    <span>${escapeHTML(item.sub)}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="generate-row">
              <div class="generate-note">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5l1.3 4.1L13.5 7l-4.2 1.4L8 12.5 6.7 8.4 2.5 7l4.2-1.4L8 1.5Z" stroke="currentColor" stroke-linejoin="round"/><path d="M13 11.2l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" fill="currentColor" opacity=".65"/></svg>
                <span>将生成 <strong>4 个创意</strong> · 每个附 AI 分析</span>
              </div>
              <button type="button" class="primary-btn" data-action="generate" id="generateBtn"${genreCount ? '' : ' disabled'}>
                <span>生成故事创意</span>
                <span class="btn-arrow"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              </button>
            </div>
          </section>

          <aside class="compass-panel" aria-label="创作坐标">
            <div class="compass-top">
              <span class="kicker">STORY COMPASS</span>
              <span class="live-badge">LIVE BRIEF</span>
            </div>

            <div class="orbit-stage" aria-hidden="true">
              <div class="orbit"></div>
              <div class="orbit orbit-2"></div>
              <div class="orbit orbit-3"></div>
              <div class="orbit-cross"></div>
              <div class="orbit-cross orbit-cross-2"></div>
              <div class="orbit-core">
                <strong id="orbitValue">${orbit.value}</strong>
                <span id="orbitMeta">${orbit.unit}<br>三幕 · ${sceneCount} 场</span>
              </div>
              <span class="orbit-label ol-1">DURATION</span>
              <span class="orbit-label ol-2">GENRE MIX</span>
              <span class="orbit-label ol-3">TONE</span>
            </div>

            <div class="compass-summary">
              <div class="compass-row">
                <span>片长</span>
                <strong id="compassDuration">${escapeHTML(duration.label)} · ${escapeHTML(duration.note)}</strong>
              </div>
              <div class="compass-row">
                <span>题材坐标</span>
                <strong class="is-amber" id="compassGenres">${escapeHTML(state.genres.join(' × ') || '等待选择')}</strong>
              </div>
              <div class="compass-row">
                <span>叙事重心</span>
                <strong id="compassTone">${escapeHTML(tone.note)}</strong>
              </div>
              <div class="compass-row">
                <span>推演规模</span>
                <strong>4 个方向 · 12 项指标</strong>
              </div>
            </div>

            <blockquote class="compass-quote" id="compassQuote">${escapeHTML(getCompassQuote(tone.id))}</blockquote>
          </aside>
        </div>
      </section>
    `;

    updateTopbar();
    updateSetupUI();
    persist();
  }

  function getCompassQuote(toneId) {
    if (toneId === 'emotion') return '人物不是推动情节的工具，人物是情节留下的伤口。';
    if (toneId === 'genre') return '先让观众问「然后呢」，再让他们问「为什么」。';
    return '限制不是笼子，是让故事发力的支点。';
  }

  function updateSetupUI() {
    const duration = getDuration();
    const tone = getTone();
    const genreCount = state.genres.length;
    const orbit = ORBIT_VALUES[duration.id];

    $$('.duration-option').forEach((button) => {
      const active = button.dataset.duration === duration.id;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });

    $$('.genre-chip').forEach((button) => {
      const active = state.genres.includes(button.dataset.genre);
      const maxed = genreCount >= 3 && !active;
      button.classList.toggle('is-selected', active);
      button.classList.toggle('is-maxed', maxed);
      button.setAttribute('aria-pressed', String(active));
    });

    $$('.tone-option').forEach((button) => {
      const active = button.dataset.tone === tone.id;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const durationValue = $('#fieldDurationValue');
    if (durationValue) durationValue.textContent = duration.label;
    const genreValue = $('#fieldGenreValue');
    if (genreValue) genreValue.textContent = `已选 ${genreCount} / 3`;
    const toneValue = $('#fieldToneValue');
    if (toneValue) toneValue.textContent = tone.sub;
    const primary = $('#primaryGenreText');
    if (primary) primary.textContent = state.genres[0] || '尚未选择';
    const hint = $('#genreHintText');
    if (hint) {
      hint.textContent = genreCount >= 3
        ? '已达到组合上限'
        : genreCount === 0
          ? '请至少选择一种题材'
          : `可再选择 ${3 - genreCount} 种`;
    }

    const orbitValue = $('#orbitValue');
    if (orbitValue) orbitValue.textContent = orbit.value;
    const orbitMeta = $('#orbitMeta');
    if (orbitMeta) orbitMeta.innerHTML = `${orbit.unit}<br>三幕 · ${sceneCountFor(duration.id)} 场`;
    const compassDuration = $('#compassDuration');
    if (compassDuration) compassDuration.textContent = `${duration.label} · ${duration.note}`;
    const compassGenres = $('#compassGenres');
    if (compassGenres) compassGenres.textContent = state.genres.join(' × ') || '等待选择';
    const compassTone = $('#compassTone');
    if (compassTone) compassTone.textContent = tone.note;
    const compassQuote = $('#compassQuote');
    if (compassQuote) compassQuote.textContent = getCompassQuote(tone.id);

    const generateBtn = $('#generateBtn');
    if (generateBtn) generateBtn.disabled = genreCount === 0;
    const topbarGenerate = $('#topbarGenerate');
    if (topbarGenerate) topbarGenerate.disabled = genreCount === 0;
  }

  function selectDuration(id) {
    if (id === state.durationId) return;
    state.durationId = id;
    invalidateGenerated();
    updateSetupUI();
    persist();
  }

  function toggleGenre(name) {
    const index = state.genres.indexOf(name);
    if (index >= 0) {
      state.genres.splice(index, 1);
    } else {
      if (state.genres.length >= 3) {
        showToast('最多同时选择 3 种题材，先移除一个再继续。');
        return;
      }
      state.genres.push(name);
    }
    invalidateGenerated();
    updateSetupUI();
    persist();
  }

  function selectTone(id) {
    if (id === state.tone) return;
    state.tone = id;
    invalidateGenerated();
    updateSetupUI();
    persist();
  }

  /* ---------------------------------------------------------
     idea generation + ideas screen
     --------------------------------------------------------- */

  async function generateIdeas() {
    if (!state.genres.length) {
      showToast('至少选择一个题材，AI 才能开始推演。');
      return;
    }

    const token = ++ideasToken;
    state.ideas = getRankedIdeas();
    state.selectedId = null;
    state.outline = null;
    state.production = null;
    state.analysisTab = 'emotion';
    state.characterIndex = 0;
    state.productionTab = 'script';
    state.storyboardScene = 'all';

    setStage('ideas');
    renderIdeas({ loading: true });
    scrollTop();

    const messages = [
      '扫描 12 种类型片的故事原型…',
      '把类型与片长折算成叙事限制…',
      '为每个方向寻找一个视觉母题…',
      '正在写下四个故事的第一句话…'
    ];

    for (let index = 0; index < messages.length; index += 1) {
      if (token !== ideasToken) return;
      updateThinking(messages[index], index + 1, messages.length);
      await wait(index === messages.length - 1 ? 680 : 480);
    }

    if (token !== ideasToken) return;
    await wait(240);
    if (token !== ideasToken) return;

    renderIdeas({ loading: false });
    persist();
  }

  function updateThinking(message, current, total) {
    const status = $('#thinkingStatus');
    const counter = $('#thinkingCounter');
    if (status) status.textContent = message;
    if (counter) counter.textContent = `${pad2(current)} / ${pad2(total)}`;
  }

  function renderIdeas({ loading = false } = {}) {
    setStage('ideas');
    if (loading) {
      const duration = getDuration();
      app.innerHTML = `
        <section class="ideas-page">
          ${ideasHeadTemplate(true)}
          <div class="brief-strip">
            <span class="bs-label">BRIEF</span>
            <span class="tag">${escapeHTML(duration.label)}</span>
            <span class="tag">${escapeHTML(state.genres.join(' × '))}</span>
            <span class="bs-divider"></span>
            <span>${escapeHTML(getTone().label)}叙事</span>
            <span class="bs-ai">AI 正在推演</span>
          </div>
          <div class="thinking-bar">
            <span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span id="thinkingStatus">扫描 12 种类型片的故事原型…</span>
            <span class="thinking-status" id="thinkingCounter">01 / 04</span>
          </div>
          <div class="ideas-grid">
            ${Array.from({ length: 4 }, () => `
              <div class="skeleton-card" aria-hidden="true">
                <div class="skeleton-poster"></div>
                <div class="skeleton-body">
                  <div class="skeleton-line w-30"></div>
                  <div class="skeleton-line w-60"></div>
                  <div class="skeleton-line w-90"></div>
                  <div class="skeleton-line w-75"></div>
                  <div class="skeleton-box"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      `;
      return;
    }

    if (!state.ideas.length) {
      renderSetup();
      return;
    }

    if (state.selectedId && !state.ideas.some((idea) => idea.id === state.selectedId)) {
      state.selectedId = null;
    }

    const pack = getPackMeta();
    const selected = getSelectedIdea();
    const wildcardCount = state.ideas.filter((idea) => !idea.genres.some((genre) => state.genres.includes(genre))).length;

    app.innerHTML = `
      <section class="ideas-page">
        ${ideasHeadTemplate(false)}
        <div class="brief-strip">
          <span class="bs-label">BRIEF</span>
          <span class="tag is-amber">${escapeHTML(getDuration().label)}</span>
          <span class="tag">${escapeHTML(state.genres.join(' × '))}</span>
          <span class="bs-divider"></span>
          <span>${escapeHTML(getTone().label)}叙事</span>
          <span class="bs-ai">${escapeHTML(pack.name)} · ${wildcardCount ? '四轮推演完成 · 含 ' + wildcardCount + ' 个类型越界' : '四轮推演完成'}</span>
        </div>
        <div class="prototype-disclosure" role="note">演示模式：当前故事来自内置样本，并非 AI 实时生成。欧美文化适配、真正重新生成与创意反馈需要后续接入模型。</div>
        <div class="ideas-summary">
          <span class="sort-note">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 3h8M3.5 6h5M5 9h2" stroke="currentColor" stroke-linecap="round"/></svg>
            题材匹配优先 · ${escapeHTML(getTone().rank)}
          </span>
          <span>04 DIRECTIONS / ONE CHOICE</span>
        </div>
        <div class="ideas-grid" id="ideasGrid">
          ${state.ideas.map((idea, index) => ideaCardTemplate(idea, index, idea.id === state.selectedId)).join('')}
        </div>
        <aside class="selection-dock" id="selectionDock" aria-live="polite"></aside>
      </section>
    `;

    updateDock(selected);
    updateTopbar();
    persist();
  }

  function ideasHeadTemplate(loading) {
    const duration = getDuration();
    return `
      <div class="stage-head">
        <div>
          <div class="eyebrow"><span class="dot"></span> 02 / CREATIVE DIRECTIONS</div>
          <h1>四个故事，<em>四道门。</em></h1>
          <p class="lede">${loading
            ? `正在以「${escapeHTML(duration.label)} · ${escapeHTML(state.genres.join(' × '))}」为坐标，推演四个故事方向。`
            : `以「${escapeHTML(duration.label)} · ${escapeHTML(state.genres.join(' × '))}」为坐标，AI 并行推演了四个故事方向。每一个都附上它为什么成立、可能在哪里失手。`
          }</p>
        </div>
        <div class="head-actions">
          <button type="button" class="ghost-btn" data-action="go-setup">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M11 7H3M6 3.5 2.5 7 6 10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            调整设定
          </button>
        </div>
      </div>
    `;
  }

  function ideaCardTemplate(idea, index, selected) {
    const scores = scoreValues(idea);
    const selectedClass = selected ? ' is-selected' : '';
    const isWildcard = !idea.genres.some((genre) => state.genres.includes(genre));
    return `
      <article
        class="idea-card${selectedClass}"
        data-idea-id="${escapeHTML(idea.id)}"
        tabindex="0"
        role="button"
        aria-pressed="${selected}"
        aria-label="选择创意《${escapeHTML(idea.title)}》"
        style="animation-delay:${index * 75}ms"
      >
        <div class="poster">
          ${posterSVG(idea)}
          <span class="poster-no">${pad2(index + 1)} / 04</span>
          <span class="poster-credit">MIJIAN ORIGINAL</span>
          <span class="poster-rule"></span>
          <span class="poster-en">${escapeHTML(idea.english)}</span>
        </div>
        <div class="idea-body">
          <div class="idea-meta">
            ${idea.genres.map((genre) => `<span class="tag">${escapeHTML(genre)}</span>`).join('')}
            ${isWildcard ? '<span class="tag is-sage">类型越界</span>' : ''}
            <span class="analysis-flag">
              <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.2l1 3.1 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1 1-3.1Z" stroke="currentColor" stroke-linejoin="round"/></svg>
              AI 创意分析
            </span>
          </div>
          <h3 class="idea-title">${escapeHTML(idea.title)}</h3>
          <p class="idea-logline">${escapeHTML(idea.logline)}</p>

          <dl class="analysis-box">
            <div class="analysis-row">
              <dt>叙事引擎</dt>
              <dd>${escapeHTML(idea.analysis.engine)}</dd>
            </div>
            <div class="analysis-row">
              <dt>核心情绪</dt>
              <dd>${escapeHTML(idea.analysis.core)}</dd>
            </div>
            <div class="analysis-row is-risk">
              <dt>风险预判</dt>
              <dd>${escapeHTML(idea.analysis.risk)}</dd>
            </div>
          </dl>

          <div class="score-row">
            ${scoreTemplate('情绪张力', scores.tension)}
            ${scoreTemplate('视觉潜力', scores.visual)}
            ${scoreTemplate('制作可行', scores.feasibility)}
          </div>

          <div class="idea-footer">
            <p class="idea-hook">${escapeHTML(idea.hook)}</p>
            <span class="pick-hint">
              ${selected ? '已选择' : '选择这个方向'}
              <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function scoreTemplate(label, value) {
    return `
      <div class="score-item">
        <div class="score-label"><span>${escapeHTML(label)}</span><b>${value}</b></div>
        <div class="score-track"><i style="width:${value}%"></i></div>
      </div>
    `;
  }

  function selectIdea(id) {
    const idea = state.ideas.find((item) => item.id === id);
    if (!idea) return;
    state.selectedId = id;
    state.outline = null;
    state.production = null;
    state.productionTab = 'script';
    state.storyboardScene = 'all';
    $$('.idea-card').forEach((card) => {
      const active = card.dataset.ideaId === id;
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-pressed', String(active));
      const hint = $('.pick-hint', card);
      if (hint) {
        hint.firstChild.textContent = active ? '已选择' : '选择这个方向';
      }
    });
    updateDock(idea);
    persist();
  }

  function updateDock(idea) {
    const dock = $('#selectionDock');
    if (!dock) return;
    if (!idea) {
      dock.classList.remove('is-visible');
      dock.innerHTML = '';
      return;
    }
    const index = state.ideas.findIndex((item) => item.id === idea.id);
    dock.innerHTML = `
      <div class="dock-thumb">${posterSVG(idea)}</div>
      <div class="dock-copy">
        <div class="dock-kicker">SELECTED / ${pad2(index + 1)} OF 04</div>
        <div class="dock-title">${escapeHTML(idea.title)}<span>${escapeHTML(idea.genres.join(' / '))}</span></div>
        <div class="dock-meta">${escapeHTML(getDuration().label)} · 预计 ${sceneCountFor(state.durationId)} 场 · 将生成完整分析与人物弧光</div>
      </div>
      <button type="button" class="primary-btn dock-cta" data-action="to-outline">
        <span>生成剧本大纲</span>
        <span class="btn-arrow"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </button>
      <button type="button" class="dock-clear" data-action="clear-selection" aria-label="取消选择">
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      </button>
    `;
    requestAnimationFrame(() => dock.classList.add('is-visible'));
  }

  function clearSelection() {
    state.selectedId = null;
    state.outline = null;
    state.production = null;
    $$('.idea-card').forEach((card) => {
      card.classList.remove('is-selected');
      card.setAttribute('aria-pressed', 'false');
      const hint = $('.pick-hint', card);
      if (hint) hint.firstChild.textContent = '选择这个方向';
    });
    updateDock(null);
    persist();
  }

  /* ---------------------------------------------------------
     outline generation
     --------------------------------------------------------- */

  function buildOutline(idea) {
    const duration = getDuration();
    const selectedBeatIndexes = SCENE_SELECTION[duration.id] || SCENE_SELECTION.medium;
    const selectedBeats = selectedBeatIndexes
      .map((index) => ({ beat: idea.beats[index], beatIndex: index }))
      .filter((entry) => entry.beat);
    const totalSeconds = duration.seconds;
    let cursor = 0;
    let sceneNumber = 1;

    const acts = idea.acts.map((actMeta, actIndex) => {
      const actBeats = selectedBeats.filter((entry) => entry.beat.act === actIndex + 1);
      const actSeconds = totalSeconds * ACT_WEIGHTS[actIndex];
      const actStart = cursor;
      const actEnd = actStart + actSeconds;
      cursor = actEnd;
      const secondsPerScene = actBeats.length ? actSeconds / actBeats.length : actSeconds;

      const scenes = actBeats.map((entry, beatIndex) => {
        const start = actStart + beatIndex * secondsPerScene;
        const end = beatIndex === actBeats.length - 1 ? actEnd : start + secondsPerScene;
        return {
          ...entry.beat,
          beatIndex: entry.beatIndex,
          number: sceneNumber++,
          start,
          end
        };
      });

      return {
        ...actMeta,
        index: actIndex + 1,
        start: actStart,
        end: actEnd,
        scenes
      };
    });

    return {
      ideaId: idea.id,
      durationId: duration.id,
      totalSeconds,
      sceneCount: selectedBeats.length,
      acts
    };
  }

  function startOutline() {
    const idea = getSelectedIdea();
    if (!idea) {
      showToast('先选择其中一个故事方向。');
      return;
    }
    state.outline = null;
    showProcess(idea, 'outline');
  }

  function startProduction() {
    const idea = getSelectedIdea();
    if (!idea) {
      showToast('先选择一个故事方向，再生成制作包。');
      return;
    }
    ensureOutline();
    state.production = null;
    showProcess(idea, 'production');
  }

  function showProcess(idea, mode = 'outline') {
    const overlay = $('#process');
    if (!overlay) return;
    processMode = mode;
    const token = ++processToken;
    const sceneCount = sceneCountFor(state.durationId);
    const duration = getDuration();
    const isProduction = mode === 'production';
    const steps = isProduction
      ? [
          '读取大纲与人物弧光',
          `按 ${duration.label} 扩写对白与动作`,
          `为 ${idea.characters.length} 位角色锁定形象与音色`,
          `拆解 ${sceneCount} 场 · ${sceneCount * 3} 个镜头`,
          '汇总场景、素材、特效与声音清单'
        ]
      : [
          `锁定创意《${idea.title}》`,
          '提取人物欲望、恐惧与秘密',
          `搭建三幕 ${sceneCount} 场结构`,
          '校准核心情绪与成长曲线',
          '生成 AI 大纲分析'
        ];

    overlay.innerHTML = `
      <div class="process-card" role="dialog" aria-modal="true" aria-label="${isProduction ? '正在生成剧本与制作包' : '正在生成剧本大纲'}">
        <div class="process-orbit" aria-hidden="true"><span>AI</span></div>
        <span class="process-kicker">${isProduction ? 'PRODUCTION PACKAGE / 04' : 'OUTLINE ENGINE / 03'}</span>
        <h2>${isProduction
          ? `正在把《${escapeHTML(idea.title)}》<br>变成可制作的方案`
          : `正在为《${escapeHTML(idea.title)}》<br>搭建故事骨架`
        }</h2>
        <p class="process-status" id="processStatus">${escapeHTML(duration.label)} · ${escapeHTML(state.genres.join(' × '))}</p>
        <div class="process-progress" aria-hidden="true"><i id="processBar"></i></div>
        <ul class="process-steps" id="processSteps">
          ${steps.map((step, index) => `
            <li data-process-step="${index}">
              <span class="p-dot">${index + 1}</span>
              <span>${escapeHTML(step)}</span>
            </li>
          `).join('')}
        </ul>
        <button type="button" class="process-skip" data-action="skip-process">跳过推演</button>
      </div>
    `;

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    runProcess(token, steps, idea, mode);
  }

  async function runProcess(token, steps, idea, mode) {
    for (let index = 0; index < steps.length; index += 1) {
      if (token !== processToken) return;
      const list = $$('#processSteps li');
      list.forEach((item, itemIndex) => {
        item.classList.toggle('is-done', itemIndex < index);
        item.classList.toggle('is-active', itemIndex === index);
      });
      const status = $('#processStatus');
      if (status) status.textContent = steps[index];
      const bar = $('#processBar');
      if (bar) bar.style.width = `${Math.round(((index + 1) / steps.length) * 100)}%`;
      await wait(index === 0 ? 720 : 590);
    }

    if (token !== processToken) return;
    await wait(340);
    if (token !== processToken) return;
    if (mode === 'production') finishProduction(idea);
    else finishOutline(idea);
  }

  function finishOutline(idea) {
    state.outline = buildOutline(idea);
    state.analysisTab = 'emotion';
    state.characterIndex = 0;
    hideProcess();
    renderOutline();
    scrollTop();
  }

  function finishProduction(idea) {
    state.outline = ensureOutline();
    state.production = buildProduction(idea, state.outline);
    state.productionTab = 'script';
    state.storyboardScene = 'all';
    hideProcess();
    renderProduction();
    scrollTop();
  }

  function hideProcess() {
    const overlay = $('#process');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function skipProcess() {
    const idea = getSelectedIdea();
    if (!idea) return;
    processToken += 1;
    if (processMode === 'production') finishProduction(idea);
    else finishOutline(idea);
  }

  /* ---------------------------------------------------------
     production package model
     --------------------------------------------------------- */

  function scriptForScene(idea, scene) {
    const script = idea.script?.[scene.beatIndex];
    if (script) return script;
    return {
      heading: scene.place,
      blocks: [
        { type: 'action', text: scene.action },
        { type: 'action', text: scene.turn }
      ]
    };
  }

  function trimScriptBlocks(blocks, durationId) {
    if (durationId === 'medium' || durationId === 'long') return blocks;
    const targetCount = durationId === 'micro' ? 3 : 4;
    if (blocks.length <= targetCount) return blocks;

    const chosen = new Set([0, blocks.length - 1]);
    const dialogueIndexes = blocks
      .map((block, index) => (block.type === 'dialogue' ? index : -1))
      .filter((index) => index >= 0);
    const actionIndexes = blocks
      .map((block, index) => (block.type === 'action' ? index : -1))
      .filter((index) => index >= 0 && index !== 0 && index !== blocks.length - 1);

    for (const index of dialogueIndexes) {
      if (chosen.size >= targetCount) break;
      chosen.add(index);
    }
    for (const index of actionIndexes) {
      if (chosen.size >= targetCount) break;
      chosen.add(index);
    }

    return blocks.filter((block, index) => chosen.has(index));
  }

  function buildShots(idea, outline) {
    const shots = [];
    const soundBed = idea.production?.sound || [];
    let number = 1;

    outline.acts.forEach((act) => {
      act.scenes.forEach((scene, sceneIndex) => {
        const script = scriptForScene(idea, scene);
        const dialogue = script.blocks.filter((block) => block.type === 'dialogue');
        const action = script.blocks.find((block) => block.type === 'action');
        const weights = [0.3, 0.43, 0.27];
        const total = Math.max(4, scene.end - scene.start);
        let cursor = scene.start;
        const types = [
          {
            type: '大全景',
            role: '建立镜头',
            movement: sceneIndex % 2 === 0 ? '缓慢横移' : '固定机位',
            lens: '24mm · 低机位',
            description: scene.visual,
            dialogue: null
          },
          {
            type: '中景',
            role: '人物行动',
            movement: '手持跟随',
            lens: '40mm · 平视',
            description: action?.text || scene.action,
            dialogue: dialogue[0] || null
          },
          {
            type: '特写',
            role: '转折 / 钩子',
            movement: '缓慢推近',
            lens: '85mm · 浅景深',
            description: scene.turn,
            dialogue: dialogue.length > 1 ? dialogue[dialogue.length - 1] : null
          }
        ];

        types.forEach((spec, index) => {
          const start = cursor;
          const end = index === types.length - 1 ? scene.end : start + total * weights[index];
          cursor = end;
          shots.push({
            id: `S${pad2(scene.number)}-${pad2(index + 1)}`,
            number: number++,
            sceneNumber: scene.number,
            sceneTitle: scene.title,
            location: scene.place,
            shotType: spec.type,
            role: spec.role,
            movement: spec.movement,
            lens: spec.lens,
            description: spec.description,
            dialogue: spec.dialogue,
            sound: soundBed[(sceneIndex + index) % Math.max(1, soundBed.length)] || '环境声',
            vfx: index === 0 || (sceneIndex % 2 === 1 && index === 2)
              ? idea.production?.vfx?.[(sceneIndex + index) % Math.max(1, idea.production.vfx.length)] || ''
              : '',
            start,
            end,
            duration: end - start
          });
        });
      });
    });

    return shots;
  }

  function buildProduction(idea, outline) {
    const scenes = outline.acts.flatMap((act) =>
      act.scenes.map((scene) => {
        const script = scriptForScene(idea, scene);
        return {
          ...scene,
          heading: script.heading,
          blocks: trimScriptBlocks(script.blocks, outline.durationId)
        };
      })
    );

    const shots = buildShots(idea, outline);
    const dialogueCount = scenes.reduce(
      (sum, scene) => sum + scene.blocks.filter((block) => block.type === 'dialogue').length,
      0
    );
    const actionCount = scenes.reduce(
      (sum, scene) => sum + scene.blocks.filter((block) => block.type === 'action').length,
      0
    );
    const characterCount = idea.characters.length;
    const spec = idea.production || {};
    const charCount = characterCount + (spec.extras || 0);
    const textLength = scenes.reduce((sum, scene) => sum + scene.blocks.reduce((inner, block) => inner + block.text.length, 0), 0);
    const pages = Math.max(1, Math.round((textLength / 360) * 10) / 10);

    return {
      ideaId: idea.id,
      durationId: outline.durationId,
      scenes,
      shots,
      script: {
        pages,
        dialogueCount,
        actionCount,
        characterCount,
        textLength
      },
      counts: {
        characters: characterCount,
        castTotal: charCount,
        extras: spec.extras || 0,
        locations: spec.locations?.length || 0,
        props: spec.props?.length || 0,
        assets: spec.assets?.length || 0,
        vfx: spec.vfx?.length || 0,
        shots: shots.length,
        weeks: spec.weeks || 6
      }
    };
  }

  /* ---------------------------------------------------------
     outline screen
     --------------------------------------------------------- */

  function ensureOutline() {
    const idea = getSelectedIdea();
    if (!idea) return null;
    if (!state.outline || state.outline.ideaId !== idea.id || state.outline.durationId !== state.durationId) {
      state.outline = buildOutline(idea);
    }
    return state.outline;
  }

  function renderOutline() {
    const idea = getSelectedIdea();
    const outline = ensureOutline();
    if (!idea || !outline) {
      if (state.ideas.length) renderIdeas();
      else renderSetup();
      return;
    }

    setStage('outline');
    if (state.characterIndex >= idea.characters.length) state.characterIndex = 0;

    const duration = getDuration();
    const totalScenes = outline.acts.reduce((sum, act) => sum + act.scenes.length, 0);

    app.innerHTML = `
      <section class="outline-page">
        <div class="outline-head">
          <div class="breadcrumb">
            <button type="button" data-action="back-ideas">02 创意选择</button>
            <span class="sep">/</span>
            <span class="current">03 剧本大纲</span>
            <span class="sep">/</span>
            <span>AI 已生成</span>
          </div>
          <div class="outline-title-row">
            <div class="outline-title">
              <h1>${escapeHTML(idea.title)}</h1>
              <span class="outline-en">${escapeHTML(idea.english)} · OUTLINE v1</span>
              <p class="outline-logline">${escapeHTML(idea.logline)}</p>
            </div>
            <div class="outline-actions">
              <button type="button" class="ghost-btn" data-action="export">
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v7M4.5 6.5 7 9l2.5-2.5M2.5 11.5h9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                导出大纲
              </button>
              <button type="button" class="primary-btn" data-action="to-production">
                <span>生成剧本制作包</span>
                <span class="btn-arrow"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              </button>
            </div>
          </div>
          <div class="outline-meta">
            <span class="tag is-amber">${escapeHTML(duration.label)}</span>
            ${idea.genres.map((genre) => `<span class="tag">${escapeHTML(genre)}</span>`).join('')}
            <span class="meta-divider"></span>
            <span class="meta-stat"><b>${totalScenes}</b> 场</span>
            <span class="meta-stat"><b>${escapeHTML(formatDuration(outline.totalSeconds))}</b> 预计成片</span>
            <span class="meta-stat"><b>${idea.characters.length}</b> 位核心人物</span>
            <span class="meta-stat"><b>3</b> 幕</span>
          </div>
          <div class="mobile-analysis-cta">
            <span class="mac-mark">AI</span>
            <span class="mac-copy">
              <b>大纲分析已生成</b>
              <small>核心情绪 · 人物弧光 · 结构诊断</small>
            </span>
            <button type="button" class="text-btn" data-action="jump-analysis">查看分析 ↓</button>
          </div>
        </div>

        <div class="outline-layout">
          <div class="outline-main">
            <div class="section-heading">
              <span class="kicker">STRUCTURE / 结构大纲</span>
              <span class="section-note">点击场次查看转折与视觉母题</span>
            </div>

            ${outline.acts.map((act, actIndex) => actTemplate(act, actIndex)).join('')}

            <div class="outline-note">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.8l1.4 4.3 4.3 1.4-4.3 1.4L8 13.2 6.6 8.9 2.3 7.5l4.3-1.4L8 1.8Z" stroke="currentColor" stroke-linejoin="round"/><path d="M13 11.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" fill="currentColor" opacity=".6"/></svg>
              <p><strong>结构手记 /</strong> ${escapeHTML(idea.diagnosis.suggestion)}</p>
            </div>
          </div>

          <aside class="analysis-panel" aria-label="AI 大纲分析">
            <div class="analysis-head">
              <span class="kicker">AI SCRIPT ANALYSIS</span>
              <span class="analysis-status">ANALYSIS READY</span>
            </div>
            <div class="analysis-tabs" role="tablist" aria-label="大纲分析维度">
              <button type="button" class="analysis-tab${state.analysisTab === 'emotion' ? ' is-active' : ''}" data-analysis-tab="emotion" role="tab" aria-selected="${state.analysisTab === 'emotion'}">核心情绪</button>
              <button type="button" class="analysis-tab${state.analysisTab === 'character' ? ' is-active' : ''}" data-analysis-tab="character" role="tab" aria-selected="${state.analysisTab === 'character'}">人物分析</button>
              <button type="button" class="analysis-tab${state.analysisTab === 'diagnosis' ? ' is-active' : ''}" data-analysis-tab="diagnosis" role="tab" aria-selected="${state.analysisTab === 'diagnosis'}">结构诊断</button>
            </div>
            <div class="analysis-content" id="analysisContent">
              ${renderAnalysisContent(idea, state.analysisTab)}
            </div>
            <div class="analysis-foot">
              <span>12 INDICATORS · NARRATIVE MODEL</span>
              <span>MIJIAN / ANALYST 01</span>
            </div>
          </aside>
        </div>

        <div class="next-chapter">
          <div class="next-copy">
            <span class="kicker">NEXT / PRODUCTION PACKAGE</span>
            <h2>让故事可以被做出来。</h2>
            <p>下一步，AI 会生成完整剧本、角色形象与音色、分镜表，以及场景、素材与特效清单。</p>
          </div>
          <div class="next-actions">
            <button type="button" class="ghost-btn" data-action="export">先导出大纲</button>
            <button type="button" class="primary-btn" data-action="to-production">
              <span>进入剧本与制作</span>
              <span class="btn-arrow"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            </button>
          </div>
        </div>
      </section>
    `;

    updateTopbar();
    persist();
  }

  function actTemplate(act, index) {
    return `
      <section class="act" data-act="${act.index}">
        <button type="button" class="act-head" data-act-toggle aria-expanded="true">
          <span class="act-num"><span>ACT ${pad2(act.index)}</span><small>${escapeHTML(act.name)}</small></span>
          <span class="act-title-wrap">
            <h2>${escapeHTML(act.title)}</h2>
            <p>${escapeHTML(act.beat)} · ${act.scenes.length} 场</p>
          </span>
          <span class="act-time">${formatClock(act.start)} – ${formatClock(act.end)}</span>
          <span class="act-chevron" aria-hidden="true"></span>
        </button>
        <div class="act-scenes">
          <div class="scenes-divider"></div>
          ${act.scenes.map((scene, sceneIndex) => sceneTemplate(scene, index === 0 && sceneIndex === 0)).join('')}
        </div>
      </section>
    `;
  }

  function sceneTemplate(scene, open) {
    return `
      <article class="scene${open ? ' is-open' : ''}" data-scene="${scene.number}">
        <button type="button" class="scene-summary" data-scene-toggle aria-expanded="${open}">
          <span class="scene-no">${pad2(scene.number)}</span>
          <span class="scene-main">
            <span class="scene-meta">
              <span>${formatClock(scene.start)} – ${formatClock(scene.end)}</span>
              <span class="meta-dot"></span>
              <span>${escapeHTML(scene.place)}</span>
            </span>
            <h3>${escapeHTML(scene.title)}</h3>
            <p>${escapeHTML(scene.action)}</p>
          </span>
          <span class="scene-tags"><span class="tag">${escapeHTML(scene.purpose.split('，')[0])}</span></span>
          <span class="scene-toggle" aria-hidden="true"></span>
        </button>
        <dl class="scene-detail">
          <div><dt>转折 / TURN</dt><dd>${escapeHTML(scene.turn)}</dd></div>
          <div><dt>场景功能 / FUNCTION</dt><dd>${escapeHTML(scene.purpose)}</dd></div>
          <div><dt>视觉母题 / MOTIF</dt><dd>${escapeHTML(scene.visual)}</dd></div>
        </dl>
      </article>
    `;
  }

  /* ---------------------------------------------------------
     production screen
     --------------------------------------------------------- */

  function formatShotSeconds(seconds) {
    const value = Math.round(seconds * 10) / 10;
    return `${value.toFixed(value < 10 ? 1 : 0)}s`;
  }

  function ensureProduction() {
    const idea = getSelectedIdea();
    const outline = ensureOutline();
    if (!idea || !outline) return null;
    if (
      !state.production ||
      state.production.ideaId !== idea.id ||
      state.production.durationId !== outline.durationId
    ) {
      state.production = buildProduction(idea, outline);
    }
    return state.production;
  }

  function renderProduction() {
    const idea = getSelectedIdea();
    const outline = ensureOutline();
    const production = ensureProduction();
    if (!idea || !outline || !production) {
      if (state.ideas.length) renderIdeas();
      else renderSetup();
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speakingVoiceIndex = null;
    }
    setStage('production');
    if (!['script', 'characters', 'storyboard', 'manifest'].includes(state.productionTab)) {
      state.productionTab = 'script';
    }
    if (state.storyboardScene !== 'all' && !production.scenes.some((scene) => scene.number === state.storyboardScene)) {
      state.storyboardScene = 'all';
    }

    const spec = idea.production || {};
    const duration = getDuration();

    app.innerHTML = `
      <section class="production-page">
        <div class="production-head">
          <div class="breadcrumb">
            <button type="button" data-action="back-outline">03 剧本大纲</button>
            <span class="sep">/</span>
            <span class="current">04 剧本与制作</span>
            <span class="sep">/</span>
            <span class="production-ready">制作包已就绪</span>
          </div>
          <div class="production-title-row">
            <div class="production-title">
              <span class="kicker">PRODUCTION PACKAGE / 04</span>
              <h1>${escapeHTML(idea.title)}</h1>
              <p class="production-logline">${escapeHTML(idea.logline)}</p>
              <div class="production-tagline">
                <span class="tag is-amber">${escapeHTML(duration.label)}</span>
                ${idea.genres.map((genre) => `<span class="tag">${escapeHTML(genre)}</span>`).join('')}
                <span class="tag is-sage">${escapeHTML(spec.complexity || '中')}复杂度</span>
                <span class="tag">${escapeHTML(spec.format || '动画短片')}</span>
              </div>
            </div>
            <div class="production-actions">
              <button type="button" class="ghost-btn" data-action="export-script">
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v7M4.5 6.5 7 9l2.5-2.5M2.5 11.5h9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                导出剧本 .md
              </button>
              <button type="button" class="primary-btn" data-action="export-package">
                <span>导出制作包 .json</span>
                <span class="btn-arrow"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              </button>
            </div>
          </div>

          <div class="production-kpis" aria-label="制作概览">
            ${productionKpi('CAST', production.counts.characters, '核心角色', `${production.counts.extras} 群演`)}
            ${productionKpi('LOCATIONS', production.counts.locations, '场景', '含内外景')}
            ${productionKpi('SHOTS', production.counts.shots, '分镜', `${formatShotSeconds(production.shots.reduce((sum, shot) => sum + shot.duration, 0) / Math.max(1, production.shots.length))} 平均镜长`)}
            ${productionKpi('ASSETS', production.counts.props + production.counts.assets, '道具与素材', '可交接清单')}
            ${productionKpi('VFX', production.counts.vfx, '特效类型', '含合成提示')}
            ${productionKpi('SCHEDULE', production.counts.weeks, '预估周数', '含缓冲')}
          </div>
        </div>

        <div class="production-tabs" role="tablist" aria-label="制作包模块">
          ${productionTabButton('script', '剧本正文', 'SCRIPT', `${production.scenes.length} 场`)}
          ${productionTabButton('characters', '角色与音色', 'CAST', `${idea.characters.length} 人`)}
          ${productionTabButton('storyboard', '分镜表', 'STORYBOARD', `${production.shots.length} 镜`)}
          ${productionTabButton('manifest', '制作清单', 'MANIFEST', '6 类')}
        </div>

        <div class="production-content" id="productionContent">
          ${productionTabTemplate(state.productionTab)}
        </div>
      </section>
    `;

    updateTopbar();
    persist();
  }

  function productionKpi(label, value, name, note) {
    return `
      <div class="production-kpi">
        <span class="kpi-label">${escapeHTML(label)}</span>
        <strong>${escapeHTML(String(value))}</strong>
        <div class="kpi-meta"><b>${escapeHTML(name)}</b><small>${escapeHTML(note)}</small></div>
      </div>
    `;
  }

  function productionTabButton(id, label, en, count) {
    return `
      <button type="button" class="production-tab${state.productionTab === id ? ' is-active' : ''}" data-production-tab="${id}" role="tab" aria-selected="${state.productionTab === id}">
        <span class="pt-en">${escapeHTML(en)}</span>
        <span class="pt-main">${escapeHTML(label)}</span>
        <span class="pt-count">${escapeHTML(count)}</span>
      </button>
    `;
  }

  function productionTabTemplate(tab) {
    if (tab === 'characters') return productionCharactersTemplate();
    if (tab === 'storyboard') return productionStoryboardTemplate();
    if (tab === 'manifest') return productionManifestTemplate();
    return productionScriptTemplate();
  }

  function switchProductionTab(tab) {
    if (!['script', 'characters', 'storyboard', 'manifest'].includes(tab)) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speakingVoiceIndex = null;
    }
    state.productionTab = tab;
    $$('.production-tab').forEach((button) => {
      const active = button.dataset.productionTab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const content = $('#productionContent');
    if (!content) return;
    content.classList.remove('is-switching');
    void content.offsetWidth;
    content.classList.add('is-switching');
    content.innerHTML = productionTabTemplate(tab);
    persist();
  }

  function productionScriptTemplate() {
    const idea = getSelectedIdea();
    const production = state.production;
    if (!idea || !production) return '';
    const duration = getDuration();

    return `
      <div class="script-layout">
        <aside class="script-rail">
          <div class="rail-head">
            <span class="kicker">SCENES / 场次</span>
            <span class="rail-count">${pad2(production.scenes.length)}</span>
          </div>
          <div class="script-index">
            ${production.scenes.map((scene) => `
              <button type="button" class="script-index-item${scene.number === 1 ? ' is-active' : ''}" data-script-scene="${scene.number}">
                <span class="si-no">${pad2(scene.number)}</span>
                <span class="si-main">
                  <b>${escapeHTML(scene.title)}</b>
                  <small>${formatClock(scene.start)} – ${formatClock(scene.end)} · ${escapeHTML(scene.place)}</small>
                </span>
              </button>
            `).join('')}
          </div>
          <div class="script-stats">
            <div><span>篇幅</span><b>${production.script.pages.toFixed(1)} 页</b></div>
            <div><span>对白</span><b>${production.script.dialogueCount} 句</b></div>
            <div><span>动作</span><b>${production.script.actionCount} 段</b></div>
          </div>
          <button type="button" class="ghost-btn rail-export" data-action="export-script">
            导出剧本 .md
          </button>
        </aside>

        <article class="screenplay" aria-label="《${escapeHTML(idea.title)}》剧本正文">
          <div class="script-cover">
            <div class="cover-top">
              <span>MIJIAN / SHOOTING SCRIPT</span>
              <span>DRAFT 01 · ${escapeHTML(duration.short.toUpperCase())}</span>
            </div>
            <h2>${escapeHTML(idea.title)}</h2>
            <p class="cover-en">${escapeHTML(idea.english)}</p>
            <div class="cover-meta">
              <div><span>片长</span><b>${escapeHTML(duration.label)}</b></div>
              <div><span>题材</span><b>${escapeHTML(idea.genres.join(' / '))}</b></div>
              <div><span>场次</span><b>${production.scenes.length} 场</b></div>
              <div><span>人物</span><b>${idea.characters.length} 位核心角色</b></div>
            </div>
            <div class="cover-stamp">第 1 稿</div>
            <p class="cover-note">本稿由剧本大纲扩写而成，按 ${escapeHTML(duration.label)} 目标时长组织场次与对白。</p>
          </div>

          <div class="script-body">
            ${production.scenes.map((scene, index) => `
              <section class="screenplay-scene" id="script-scene-${scene.number}" data-screenplay-scene="${scene.number}">
                <div class="screenplay-heading">
                  <span class="sh-no">${pad2(scene.number)}</span>
                  <div>
                    <h3>${escapeHTML(scene.heading)}</h3>
                    <p>${formatClock(scene.start)} – ${formatClock(scene.end)} · ${escapeHTML(scene.place)}</p>
                  </div>
                </div>
                <div class="screenplay-blocks">
                  ${scene.blocks.map((block) => productionBlockTemplate(block)).join('')}
                </div>
                ${index < production.scenes.length - 1 ? '<div class="script-break" aria-hidden="true"></div>' : ''}
              </section>
            `).join('')}
          </div>
        </article>
      </div>
    `;
  }

  function productionBlockTemplate(block) {
    if (block.type === 'dialogue') {
      return `
        <div class="screenplay-dialogue">
          <div class="sd-who">${escapeHTML(block.who)}${block.paren ? `<span>${escapeHTML(block.paren)}</span>` : ''}</div>
          <p>${escapeHTML(block.text)}</p>
        </div>
      `;
    }
    return `<p class="screenplay-action">${escapeHTML(block.text)}</p>`;
  }

  function productionCharactersTemplate() {
    const idea = getSelectedIdea();
    if (!idea) return '';
    return `
      <div class="cast-intro">
        <div>
          <span class="kicker">CHARACTER BIBLE / 角色设定</span>
          <h2>先让角色被看见，再让他们开口。</h2>
        </div>
        <p>形象与音色都从人物性格、欲望和恐惧推导。试听使用浏览器系统语音，只用于确认音高、语速与气质方向。</p>
      </div>
      <div class="character-grid">
        ${idea.characters.map((character, index) => characterCardTemplate(character, index)).join('')}
      </div>
      <div class="cast-footnote">
        <span class="footnote-mark">NOTE</span>
        <p>正式制作时，可在这四组参数上继续细化：形象三视图、表情包、口型音素表、配音演员试音。当前版本先将方向锁定，避免后续资产发散。</p>
      </div>
    `;
  }

  function characterCardTemplate(character, index) {
    const idea = getSelectedIdea();
    const design = character.design || {};
    const voice = design.voice || {};
    const stats = voice.stats || { pitch: 50, pace: 50, warmth: 50 };
    return `
      <article class="character-card">
        <div class="character-visual">
          ${characterPortraitSVG(character, idea, index)}
          <div class="character-visual-top">
            <span>CHARACTER ${pad2(index + 1)}</span>
            <span>${escapeHTML(idea.genres[0])}</span>
          </div>
          <div class="character-visual-bottom">
            <span>${escapeHTML(character.name)}</span>
            <small>${escapeHTML(character.role)}</small>
          </div>
        </div>
        <div class="character-info">
          <div class="character-name-row">
            <div>
              <h2>${escapeHTML(character.name)}</h2>
              <p>${escapeHTML(character.role)}</p>
            </div>
            <div class="character-palette" aria-label="角色色彩">
              ${(design.palette || []).map((color) => `<i style="background:${color}" title="${color}"></i>`).join('')}
            </div>
          </div>
          <p class="character-quote">${escapeHTML(character.quote)}</p>
          <div class="character-keywords">
            ${(design.keywords || []).map((keyword) => `<span>${escapeHTML(keyword)}</span>`).join('')}
          </div>

          <div class="character-design-grid">
            <div><span>年龄 / 外形</span><p>${escapeHTML(design.ageLook)}</p></div>
            <div><span>轮廓</span><p>${escapeHTML(design.silhouette)}</p></div>
            <div><span>服装</span><p>${escapeHTML(design.wardrobe)}</p></div>
            <div><span>记忆点</span><p>${escapeHTML(design.features)}</p></div>
          </div>

          <div class="voice-card" data-voice-card="${index}">
            <div class="voice-head">
              <div>
                <span class="voice-kicker">VOICE DESIGN / 音色</span>
                <strong>${escapeHTML(voice.timbre)}</strong>
              </div>
              <button type="button" class="voice-play" data-voice-index="${index}">
                <span class="voice-icon" aria-hidden="true">
                  <svg viewBox="0 0 14 14" fill="none"><path d="M5 3.5 10 7l-5 3.5V3.5Z" fill="currentColor"/></svg>
                </span>
                <span>试听台词</span>
              </button>
            </div>
            <div class="voice-wave" aria-hidden="true">
              ${Array.from({ length: 30 }, (_, barIndex) => {
                const height = 16 + Math.abs(Math.sin(barIndex * 1.28 + index)) * 66;
                return `<i style="--h:${height.toFixed(0)}%;--d:${(barIndex * 0.035).toFixed(2)}s"></i>`;
              }).join('')}
            </div>
            <div class="voice-facts">
              <div><span>音高</span><p>${escapeHTML(voice.pitch)}</p></div>
              <div><span>语速</span><p>${escapeHTML(voice.pace)}</p></div>
              <div><span>质感</span><p>${escapeHTML(voice.texture)}</p></div>
              <div><span>参考方向</span><p>${escapeHTML(voice.reference)}</p></div>
            </div>
            <div class="voice-meters">
              ${voiceMeter('低音 / 高音', stats.pitch)}
              ${voiceMeter('慢 / 快', stats.pace)}
              ${voiceMeter('冷 / 暖', stats.warmth)}
            </div>
            <p class="voice-sample">「${escapeHTML(character.quote)}」</p>
          </div>
        </div>
      </article>
    `;
  }

  function voiceMeter(label, value) {
    return `
      <div class="voice-meter">
        <div class="vm-label"><span>${escapeHTML(label)}</span><b>${value}</b></div>
        <div class="vm-track"><i style="width:${value}%"></i></div>
      </div>
    `;
  }

  function productionStoryboardTemplate() {
    const idea = getSelectedIdea();
    const production = state.production;
    if (!idea || !production) return '';
    const filter = state.storyboardScene;
    const scenes = filter === 'all'
      ? production.scenes
      : production.scenes.filter((scene) => scene.number === filter);
    const vfxShots = production.shots.filter((shot) => shot.vfx).length;
    const avg = production.shots.reduce((sum, shot) => sum + shot.duration, 0) / Math.max(1, production.shots.length);

    return `
      <div class="storyboard-toolbar">
        <div>
          <span class="kicker">SHOT LIST / 分镜表</span>
          <h2>镜头是剧本的第二次写作。</h2>
        </div>
        <div class="storyboard-stats">
          <div><b>${production.shots.length}</b><span>镜头</span></div>
          <div><b>${formatShotSeconds(avg)}</b><span>平均镜长</span></div>
          <div><b>${vfxShots}</b><span>特效镜头</span></div>
        </div>
      </div>

      <div class="storyboard-filter" role="group" aria-label="按场次筛选分镜">
        <button type="button" class="filter-chip${filter === 'all' ? ' is-active' : ''}" data-storyboard-filter="all">全部场次 <span>${production.shots.length}</span></button>
        ${production.scenes.map((scene) => `
          <button type="button" class="filter-chip${filter === scene.number ? ' is-active' : ''}" data-storyboard-filter="${scene.number}">${pad2(scene.number)} ${escapeHTML(scene.title)} <span>${production.shots.filter((shot) => shot.sceneNumber === scene.number).length}</span></button>
        `).join('')}
      </div>

      <div class="storyboard-list">
        ${scenes.map((scene) => {
          const shots = production.shots.filter((shot) => shot.sceneNumber === scene.number);
          return `
            <section class="storyboard-scene">
              <div class="storyboard-scene-head">
                <span class="ss-no">SCENE ${pad2(scene.number)}</span>
                <h3>${escapeHTML(scene.title)}</h3>
                <p>${formatClock(scene.start)} – ${formatClock(scene.end)} · ${escapeHTML(scene.place)}</p>
              </div>
              <div class="shot-grid">
                ${shots.map((shot) => shotCardTemplate(shot)).join('')}
              </div>
            </section>
          `;
        }).join('')}
      </div>
    `;
  }

  function shotCardTemplate(shot) {
    const idea = getSelectedIdea();
    return `
      <article class="shot-card">
        <div class="shot-frame">
          ${shotFrameSVG(idea, shot)}
          <span class="shot-frame-id">${escapeHTML(shot.id)}</span>
          <span class="shot-frame-time">${formatShotSeconds(shot.duration)}</span>
          <span class="shot-frame-rule" aria-hidden="true"></span>
        </div>
        <div class="shot-body">
          <div class="shot-tags">
            <span class="tag is-amber">${escapeHTML(shot.shotType)}</span>
            <span class="tag">${escapeHTML(shot.movement)}</span>
          </div>
          <h3>${escapeHTML(shot.role)}</h3>
          <p class="shot-desc">${escapeHTML(shot.description)}</p>
          ${shot.dialogue ? `<div class="shot-dialogue"><span>${escapeHTML(shot.dialogue.who)}</span><p>${escapeHTML(shot.dialogue.text)}</p></div>` : ''}
          <div class="shot-meta">
            <span>${escapeHTML(shot.lens)}</span>
            <span>${escapeHTML(shot.location)}</span>
          </div>
          <div class="shot-tech">
            <span>♪ ${escapeHTML(shot.sound)}</span>
            ${shot.vfx ? `<span>✦ ${escapeHTML(shot.vfx)}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function productionManifestTemplate() {
    const idea = getSelectedIdea();
    const production = state.production;
    const spec = idea?.production;
    if (!idea || !production || !spec) return '';

    return `
      <div class="manifest-hero">
        <div class="manifest-hero-copy">
          <span class="kicker">PRODUCTION MANIFEST / 制作清单</span>
          <h2>把「拍什么」变成「怎么准备」。</h2>
          <p>以下清单按剧本场次与分镜自动汇总，可直接作为美术、动画、特效、声音和制片的交接底稿。</p>
        </div>
        <div class="manifest-format">
          <span>FORMAT</span>
          <strong>${escapeHTML(spec.format)}</strong>
          <p>${escapeHTML(spec.complexity)}复杂度 · 预估 ${production.counts.weeks} 周</p>
        </div>
      </div>

      <div class="manifest-overview">
        ${manifestStat('角色 / 群演', `${production.counts.characters} / ${production.counts.extras}`, '核心角色与群演')}
        ${manifestStat('场景', `${production.counts.locations}`, '含内外景')}
        ${manifestStat('道具', `${production.counts.props}`, '需建模 / 采购')}
        ${manifestStat('素材', `${production.counts.assets}`, '场景 / 环境 / UI')}
        ${manifestStat('特效', `${production.counts.vfx}`, '类型级 VFX')}
        ${manifestStat('镜头', `${production.counts.shots}`, '分镜总数')}
      </div>

      <div class="manifest-grid">
        ${manifestPanel('场景 / LOCATIONS', 'SETS', spec.locations.map((item) => ({ title: item.name, meta: `${item.kind} · ${item.note}` })))}
        ${manifestPanel('道具 / PROPS', 'PROPS', spec.props.map((item) => ({ title: item, meta: '实体 / 建模道具' })))}
        ${manifestPanel('素材 / ASSETS', 'ASSETS', spec.assets.map((item) => ({ title: item, meta: '可复用资产' })))}
        ${manifestPanel('特效 / VFX', 'VFX', spec.vfx.map((item) => ({ title: item, meta: '合成 / 粒子 / 光效' })))}
        ${manifestPanel('声音 / SOUND', 'SOUND', spec.sound.map((item) => ({ title: item, meta: '音效 / 环境 / 音乐' })))}
        ${manifestPanel('动画 / ANIMATION', 'ANIM', spec.animation.map((item) => ({ title: item, meta: '表演与解算' })))}
      </div>

      <div class="manifest-lower">
        <section class="risk-card">
          <span class="kicker">RISK WATCH / 制作风险</span>
          <ul>${spec.risks.map((risk) => `<li>${escapeHTML(risk)}</li>`).join('')}</ul>
        </section>
        <section class="delivery-card">
          <span class="kicker">HANDOFF / 交付清单</span>
          <div class="delivery-list">
            ${['剧本正文', '角色形象与色彩', '音色方向', '分镜表', '资产清单', '特效与声音清单'].map((item) => `
              <span><i>✓</i>${escapeHTML(item)}</span>
            `).join('')}
          </div>
          <button type="button" class="primary-btn" data-action="export-package">
            <span>下载完整制作包 .json</span>
            <span class="btn-arrow"><svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          </button>
        </section>
      </div>
    `;
  }

  function manifestStat(label, value, note) {
    return `
      <div class="manifest-stat">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
        <small>${escapeHTML(note)}</small>
      </div>
    `;
  }

  function manifestPanel(title, en, items) {
    return `
      <section class="manifest-panel">
        <header>
          <div><span class="mp-en">${escapeHTML(en)}</span><h3>${escapeHTML(title)}</h3></div>
          <span class="mp-count">${pad2(items.length)}</span>
        </header>
        <ul>
          ${items.map((item) => `
            <li><b>${escapeHTML(item.title)}</b><span>${escapeHTML(item.meta)}</span></li>
          `).join('')}
        </ul>
      </section>
    `;
  }

  /* ---------------------------------------------------------
     character portraits + storyboard frames
     --------------------------------------------------------- */

  function characterPortraitSVG(character, idea, index) {
    const palette = character.design?.palette || [idea.palette.bg1, idea.palette.accent, idea.palette.warm];
    const base = palette[0];
    const accent = palette[1] || idea.palette.accent;
    const warm = palette[2] || idea.palette.warm;
    const id = `character${++portraitSeq}`;
    const flip = index % 2 === 0 ? 1 : -1;
    const ageMatch = String(character.design?.ageLook || '').match(/(\d+)\s*岁/);
    const age = ageMatch ? Number(ageMatch[1]) : 30;
    const isChild = age <= 14;
    const isElder = age >= 60;
    const figureScale = isChild ? 0.72 : isElder ? 0.92 : 1;
    const figureY = isChild ? 292 : isElder ? 268 : 260;
    const hairColor = isElder ? '#bdb6a8' : base;
    const hair = isChild
      ? `<path d="M-58 32C-54-24-25-48 6-43c32 5 52 31 50 72-10-10-18-21-25-35-8 15-28 24-60 28Z" fill="${hairColor}"/>`
      : isElder
        ? `<path d="M-50 28c-5-32 15-58 48-58 31 0 51 24 49 59-12-8-24-15-47-16-20-1-36 5-50 15Z" fill="${hairColor}"/>`
        : `<path d="M-54 30C-48-20-21-46 7-41c30 5 49 31 48 70-12-12-20-24-28-38-9 18-34 26-81 39Z" fill="${hairColor}"/>`;
    return `
      <svg viewBox="0 0 360 470" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeHTML(character.name)} 角色概念图">
        <defs>
          <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${base}"/>
            <stop offset=".62" stop-color="${idea.palette.bg2}"/>
            <stop offset="1" stop-color="${base}"/>
          </linearGradient>
          <radialGradient id="${id}-halo" cx=".5" cy=".4" r=".55">
            <stop offset="0" stop-color="${accent}" stop-opacity=".45"/>
            <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="${id}-coat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${warm}" stop-opacity=".36"/>
            <stop offset="1" stop-color="${base}" stop-opacity=".95"/>
          </linearGradient>
        </defs>
        <rect width="360" height="470" fill="url(#${id}-bg)"/>
        <circle cx="180" cy="180" r="180" fill="url(#${id}-halo)"/>
        <g opacity=".16" stroke="${accent}" stroke-width=".6" fill="none">
          <path d="M0 92h360M0 184h360M0 276h360M0 368h360"/>
          <path d="M60 0v470M120 0v470M180 0v470M240 0v470M300 0v470"/>
        </g>
        <text x="20" y="410" fill="${accent}" opacity=".14" font-family="Georgia, serif" font-size="118">${escapeHTML(character.initial)}</text>
        <g transform="translate(${180 + flip * 24} ${figureY}) scale(${flip * figureScale} ${figureScale})">
          <path d="M-92 210C-78 106 -42 58 -12 58H22C54 58 86 111 98 210H-92Z" fill="#12120f" opacity=".78"/>
          <path d="M-78 210C-64 120 -35 78 -10 78H18C47 78 73 122 84 210H-78Z" fill="url(#${id}-coat)" stroke="${accent}" stroke-opacity=".18"/>
          <path d="M-32 82h64v54c0 25-14 42-32 42s-32-17-32-42V82Z" fill="#1b1a15"/>
          <ellipse cx="0" cy="46" rx="54" ry="63" fill="#181712"/>
          ${hair}
          <path d="M-50 37C-44 84 -18 106 9 101c27-5 43-30 42-65" fill="none" stroke="${accent}" stroke-opacity=".55" stroke-width="1.2"/>
          <path d="M-29 38h18M15 38h18" stroke="${accent}" stroke-opacity=".55" stroke-width="1.2"/>
          <path d="M-12 70c8 5 17 5 25 0" stroke="${warm}" stroke-opacity=".45" stroke-width="1.1" fill="none"/>
          <path d="M-92 210h184" stroke="${accent}" stroke-opacity=".22"/>
          <path d="M-46 124l-9 80M48 124l9 80" stroke="${accent}" stroke-opacity=".22"/>
        </g>
        <path d="M24 24h18M24 24v18M336 24h-18M336 24v18M24 446h18M24 446v-18M336 446h-18M336 446v-18" stroke="${accent}" stroke-opacity=".5" fill="none"/>
        <text x="28" y="44" fill="${accent}" opacity=".7" font-family="Bahnschrift, sans-serif" font-size="7" letter-spacing="2">CONCEPT / ${pad2(index + 1)}</text>
        <text x="332" y="44" text-anchor="end" fill="${accent}" opacity=".45" font-family="Bahnschrift, sans-serif" font-size="7" letter-spacing="1">${escapeHTML(character.role.split(' / ')[0])}</text>
      </svg>
    `;
  }

  function shotFrameSVG(idea, shot) {
    const p = idea.palette;
    const id = `frame${++frameSeq}`;
    const isWide = shot.shotType === '大全景';
    const isClose = shot.shotType === '特写';
    const shift = ((shot.sceneNumber - 1) % 3 - 1) * 18;
    return `
      <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeHTML(shot.role)} 分镜示意">
        <defs>
          <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${p.bg1}"/>
            <stop offset=".62" stop-color="${p.bg2}"/>
            <stop offset="1" stop-color="${p.bg1}"/>
          </linearGradient>
          <radialGradient id="${id}-glow" cx=".5" cy=".5" r=".55">
            <stop offset="0" stop-color="${p.accent}" stop-opacity=".55"/>
            <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="480" height="270" fill="url(#${id}-bg)"/>
        <ellipse cx="${isClose ? 250 + shift : 330 - shift}" cy="${isWide ? 80 : 120}" rx="160" ry="120" fill="url(#${id}-glow)"/>
        <g opacity=".16" stroke="${p.ink}" stroke-width=".7" fill="none">
          <path d="M0 54h480M0 108h480M0 162h480M0 216h480"/>
          <path d="M80 0v270M160 0v270M240 0v270M320 0v270M400 0v270"/>
        </g>
        ${shotBackdrop(idea, shot, shift)}
        ${shotComposition(idea, shot, isWide, isClose, shift)}
        <rect x="0" y="0" width="480" height="18" fill="#060605" opacity=".36"/>
        <rect x="0" y="252" width="480" height="18" fill="#060605" opacity=".36"/>
        <g stroke="${p.ink}" stroke-opacity=".55" stroke-width="1" fill="none">
          <path d="M16 36V16h20M464 36V16h-20M16 234v20h20M464 234v20h-20"/>
        </g>
        <circle cx="240" cy="135" r="3" fill="none" stroke="${p.ink}" stroke-opacity=".25"/>
        <path d="M240 128v-5M240 142v5M233 135h-5M247 135h5" stroke="${p.ink}" stroke-opacity=".25"/>
      </svg>
    `;
  }

  function shotBackdrop(idea, shot, shift) {
    const p = idea.palette;
    switch (idea.art) {
      case 'depth':
        return `
          <g opacity=".52" transform="translate(${shift} 0)">
            <circle cx="350" cy="120" r="94" fill="none" stroke="${p.accent}" stroke-opacity=".2"/>
            <circle cx="350" cy="120" r="72" fill="none" stroke="${p.accent}" stroke-opacity=".12" stroke-dasharray="2 6"/>
            <circle cx="350" cy="120" r="34" fill="none" stroke="${p.ink}" stroke-opacity=".08"/>
          </g>
        `;
      case 'signal':
        return `
          <g opacity=".32" transform="translate(0 ${shot.sceneNumber % 2 ? 0 : 8})">
            <polyline points="0,150 40,150 52,128 65,170 80,136 96,162 112,142 128,158 146,120 164,174 180,138 200,160 218,146 240,154 258,128 276,170 294,142 312,160 330,132 350,174 370,146 392,158 414,134 438,166 456,148 480,154" fill="none" stroke="${p.accent}" stroke-opacity=".2"/>
          </g>
        `;
      case 'paper':
        return `
          <g opacity=".38">
            <polygon points="0,206 70,152 138,202 210,160 286,210 360,170 438,212 480,190 480,270 0,270" fill="${p.bg1}" fill-opacity=".55"/>
            <polygon points="0,236 88,196 166,238 250,204 340,242 420,214 480,240 480,270 0,270" fill="${p.warm}" fill-opacity=".08"/>
            <circle cx="${396 - shift}" cy="83" r="41" fill="${p.ink}" opacity=".1"/>
          </g>
        `;
      case 'radio':
        return `
          <g opacity=".38" fill="${p.bg1}">
            <rect x="0" y="196" width="44" height="74"/><rect x="50" y="178" width="36" height="92"/>
            <rect x="92" y="208" width="42" height="62"/><rect x="140" y="186" width="32" height="84"/>
            <rect x="178" y="214" width="54" height="56"/><rect x="238" y="192" width="42" height="78"/>
            <rect x="286" y="170" width="34" height="100"/><rect x="326" y="208" width="50" height="62"/>
            <rect x="382" y="184" width="38" height="86"/><rect x="426" y="210" width="54" height="60"/>
          </g>
        `;
      case 'lost':
        return `
          <g opacity=".42" stroke="${p.accent}" stroke-opacity=".18" fill="none" transform="translate(${286 + shift} 28)">
            <rect width="168" height="202"/>
            <path d="M0 50h168M0 100h168M0 150h168M0 200h168M56 0v202M112 0v202"/>
          </g>
        `;
      case 'store':
        return `
          <g opacity=".3" transform="translate(${300 + shift} 44)">
            <rect width="140" height="160" fill="${p.bg1}" fill-opacity=".5" stroke="${p.accent}" stroke-opacity=".25"/>
            <path d="M0 48h140M0 96h140M0 144h140M52 0v160M98 0v160" stroke="${p.accent}" stroke-opacity=".15"/>
            <rect y="0" width="140" height="12" fill="${p.accent}" opacity=".18"/>
          </g>
        `;
      case 'stage':
        return `
          <g opacity=".3">
            <polygon points="${310 + shift},0 ${430 + shift},0 ${510 + shift},270 ${230 + shift},270" fill="${p.accent}" opacity=".1"/>
            <ellipse cx="${360 + shift}" cy="230" rx="100" ry="15" fill="${p.bg1}" opacity=".5"/>
          </g>
        `;
      case 'moon':
        return `
          <g opacity=".36">
            <circle cx="${388 - shift}" cy="84" r="68" fill="${p.ink}" opacity=".13"/>
            <circle cx="${366 - shift}" cy="68" r="8" fill="${p.bg2}" opacity=".12"/>
            <path d="M0 228h480M0 240h480" stroke="${p.ink}" stroke-opacity=".12"/>
          </g>
        `;
      default:
        return '';
    }
  }

  function shotComposition(idea, shot, isWide, isClose, shift) {
    const p = idea.palette;
    if (isClose) {
      return `
        <g transform="translate(${shift} 0)">
          <ellipse cx="250" cy="148" rx="84" ry="98" fill="${p.bg1}" opacity=".72" stroke="${p.accent}" stroke-opacity=".2"/>
          <path d="M182 149c8-52 34-77 69-77s57 24 67 76" fill="none" stroke="${p.accent}" stroke-opacity=".34" stroke-width="1.2"/>
          <path d="M206 148h27M267 148h27" stroke="${p.ink}" stroke-opacity=".62" stroke-width="2"/>
          <path d="M208 154h23M269 154h23" stroke="${p.ink}" stroke-opacity=".22"/>
          <path d="M239 162c7 5 15 5 22 0" stroke="${p.warm}" stroke-opacity=".45" stroke-width="1.2" fill="none"/>
          <path d="M176 218c28-16 100-16 148 0" stroke="${p.accent}" stroke-opacity=".2" fill="none"/>
          <circle cx="400" cy="72" r="3" fill="${p.warm}" opacity=".7"/>
        </g>
      `;
    }
    if (isWide) {
      return `
        <g>
          <path d="M0 174C70 160 112 184 180 170s122-18 300 6v94H0Z" fill="${p.bg1}" opacity=".82"/>
          <path d="M0 202c98-10 154 8 236-2s154-10 244 4" fill="none" stroke="${p.accent}" stroke-opacity=".18"/>
          <circle cx="${354 - shift}" cy="79" r="43" fill="${p.accent}" opacity=".16" stroke="${p.accent}" stroke-opacity=".28"/>
          <g transform="translate(${112 + shift} 190)">
            <circle cx="0" cy="-32" r="6" fill="${p.bg1}" stroke="${p.ink}" stroke-opacity=".35"/>
            <path d="M-7 0c0-15 3-24 7-24s7 9 7 24" fill="${p.bg1}" stroke="${p.ink}" stroke-opacity=".35"/>
          </g>
          <path d="M380 194v48M368 194h24" stroke="${p.ink}" stroke-opacity=".16"/>
          <path d="M64 48h44M64 55h28" stroke="${p.ink}" stroke-opacity=".16"/>
        </g>
      `;
    }
    return `
      <g>
        <rect x="72" y="52" width="248" height="174" fill="${p.bg1}" opacity=".28" stroke="${p.accent}" stroke-opacity=".2"/>
        <path d="M72 100h248M196 52v174" stroke="${p.accent}" stroke-opacity=".12"/>
        <g transform="translate(${322 + shift} 222)">
          <circle cx="0" cy="-68" r="20" fill="${p.bg1}" stroke="${p.accent}" stroke-opacity=".35"/>
          <path d="M-28 0c0-52 10-76 28-76s28 24 28 76" fill="${p.bg1}" stroke="${p.accent}" stroke-opacity=".28"/>
          <path d="M-16-38l-18 38M16-38l20 38" stroke="${p.ink}" stroke-opacity=".2"/>
        </g>
        <path d="M0 232c86-12 164 6 248-2s162-8 232 2" fill="none" stroke="${p.accent}" stroke-opacity=".14"/>
        <circle cx="102" cy="70" r="2" fill="${p.warm}" opacity=".65"/>
      </g>
    `;
  }

  /* ---------------------------------------------------------
     voice preview + exports
     --------------------------------------------------------- */

  function setVoicePlaying(index, playing) {
    const card = document.querySelector(`[data-voice-card="${index}"]`);
    if (!card) return;
    card.classList.toggle('is-speaking', playing);
    const button = card.querySelector('.voice-play');
    if (button) {
      button.classList.toggle('is-playing', playing);
      const label = button.querySelector('span:last-child');
      if (label) label.textContent = playing ? '停止试听' : '试听台词';
    }
  }

  function toggleVoice(index) {
    const idea = getSelectedIdea();
    const character = idea?.characters?.[index];
    if (!character) return;
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      showToast('当前浏览器不支持系统语音试听，但音色方向已记录。');
      return;
    }
    if (speakingVoiceIndex === index) {
      window.speechSynthesis.cancel();
      return;
    }
    window.speechSynthesis.cancel();
    speakingVoiceIndex = index;
    const stats = character.design?.voice?.stats || { pitch: 50, pace: 50, warmth: 50 };
    const utterance = new SpeechSynthesisUtterance(character.quote);
    utterance.lang = 'zh-CN';
    utterance.pitch = 0.55 + (stats.pitch / 100) * 0.85;
    utterance.rate = 0.72 + (stats.pace / 100) * 0.58;
    utterance.onstart = () => setVoicePlaying(index, true);
    utterance.onend = () => { setVoicePlaying(index, false); speakingVoiceIndex = null; };
    utterance.onerror = () => { setVoicePlaying(index, false); speakingVoiceIndex = null; };
    setVoicePlaying(index, true);
    try {
      window.speechSynthesis.speak(utterance);
      showToast(`正在试听「${character.name}」的音色方向。`);
    } catch (error) {
      setVoicePlaying(index, false);
      speakingVoiceIndex = null;
      showToast('当前环境无法播放系统语音，但音色方向已记录。');
    }
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function buildScriptMarkdown() {
    const idea = getSelectedIdea();
    const production = ensureProduction();
    if (!idea || !production) return '';
    const lines = [
      `# 《${idea.title}》剧本`,
      '',
      `> ${idea.logline}`,
      '',
      `- **英文片名**：${idea.english}`,
      `- **片长**：${getDuration().label}`,
      `- **题材**：${idea.genres.join(' / ')}`,
      `- **场次**：${production.scenes.length} 场`,
      `- **人物**：${idea.characters.map((character) => character.name).join('、')}`,
      '',
      '---',
      ''
    ];

    production.scenes.forEach((scene) => {
      lines.push(`## ${pad2(scene.number)} · ${scene.heading}`);
      lines.push('');
      scene.blocks.forEach((block) => {
        if (block.type === 'dialogue') {
          lines.push(`**${block.who}**${block.paren || ''}：${block.text}`);
        } else {
          lines.push(block.text);
        }
        lines.push('');
      });
    });

    lines.push('---', '', '## 角色设定', '');
    idea.characters.forEach((character) => {
      const design = character.design || {};
      lines.push(`### ${character.name} · ${character.role}`);
      lines.push(`- 外形：${design.ageLook || ''}`);
      lines.push(`- 轮廓：${design.silhouette || ''}`);
      lines.push(`- 服装：${design.wardrobe || ''}`);
      lines.push(`- 记忆点：${design.features || ''}`);
      lines.push(`- 音色：${design.voice?.timbre || ''}`);
      lines.push(`- 音高：${design.voice?.pitch || ''}`);
      lines.push(`- 语速：${design.voice?.pace || ''}`);
      lines.push(`- 参考方向：${design.voice?.reference || ''}`);
      lines.push('');
    });

    lines.push('---', '', '## 分镜摘要', '');
    production.shots.forEach((shot) => {
      lines.push(`- **${shot.id}** ${shot.shotType} / ${shot.movement} · ${formatShotSeconds(shot.duration)}：${shot.description}`);
    });
    lines.push('', `由 幕间 MIJIAN 生成 · ${new Date().toLocaleDateString('zh-CN')}`);
    return lines.join('\n');
  }

  function exportScript() {
    const idea = getSelectedIdea();
    if (!idea || !state.production) {
      showToast('还没有可导出的剧本。');
      return;
    }
    downloadBlob(buildScriptMarkdown(), `《${idea.title}》剧本.md`, 'text/markdown;charset=utf-8');
    showToast('剧本已导出为 Markdown 文件。');
  }

  function buildProductionPackage() {
    const idea = getSelectedIdea();
    const production = ensureProduction();
    const outline = ensureOutline();
    if (!idea || !production || !outline) return null;
    const spec = idea.production || {};
    return {
      schema: 'mijian.production-package/v1',
      generatedAt: new Date().toISOString(),
      project: {
        title: idea.title,
        english: idea.english,
        logline: idea.logline,
        theme: idea.theme,
        genres: idea.genres,
        duration: {
          label: getDuration().label,
          seconds: outline.totalSeconds
        },
        format: spec.format,
        complexity: spec.complexity,
        estimatedWeeks: spec.weeks
      },
      script: {
        scenes: production.scenes.map((scene) => ({
          number: scene.number,
          heading: scene.heading,
          start: formatClock(scene.start),
          end: formatClock(scene.end),
          place: scene.place,
          blocks: scene.blocks
        })),
        pages: production.script.pages,
        dialogueCount: production.script.dialogueCount,
        actionCount: production.script.actionCount
      },
      characters: idea.characters.map((character) => ({
        name: character.name,
        role: character.role,
        quote: character.quote,
        want: character.want,
        need: character.need,
        fear: character.fear,
        secret: character.secret,
        growth: character.growth,
        design: character.design
      })),
      storyboard: production.shots.map((shot) => ({
        id: shot.id,
        sceneNumber: shot.sceneNumber,
        shotType: shot.shotType,
        role: shot.role,
        movement: shot.movement,
        lens: shot.lens,
        duration: Math.round(shot.duration * 10) / 10,
        description: shot.description,
        dialogue: shot.dialogue,
        sound: shot.sound,
        vfx: shot.vfx,
        location: shot.location
      })),
      production: {
        counts: production.counts,
        locations: spec.locations,
        props: spec.props,
        assets: spec.assets,
        vfx: spec.vfx,
        sound: spec.sound,
        animation: spec.animation,
        risks: spec.risks
      }
    };
  }

  function exportProductionPackage() {
    const idea = getSelectedIdea();
    const packageData = buildProductionPackage();
    if (!idea || !packageData) {
      showToast('制作包还没有准备好。');
      return;
    }
    downloadBlob(
      JSON.stringify(packageData, null, 2),
      `《${idea.title}》制作包.json`,
      'application/json;charset=utf-8'
    );
    showToast('完整制作包已导出，可交给后续制作流程。');
  }

  /* ---------------------------------------------------------
     analysis content
     --------------------------------------------------------- */

  function renderAnalysisContent(idea, tab) {
    if (tab === 'character') return characterTabTemplate(idea);
    if (tab === 'diagnosis') return diagnosisTabTemplate(idea);
    return emotionTabTemplate(idea);
  }

  function emotionTabTemplate(idea) {
    const arc = idea.emotion.arc;
    const peakIndex = arc.reduce((best, item, index) => (item.value > arc[best].value ? index : best), 0);
    return `
      <div class="core-label">CORE EMOTION / 核心情绪</div>
      <h3 class="core-title">${escapeHTML(idea.emotion.core)}</h3>
      <p class="analysis-copy">${escapeHTML(idea.analysis.why)}</p>
      ${emotionChart(arc, peakIndex)}
      <div class="metric-grid">
        <div class="metric-cell"><span>情绪浓度</span><strong>${idea.analysis.scores.emotion}<small>/100</small></strong></div>
        <div class="metric-cell"><span>人物弧光</span><strong>${idea.diagnosis.score}<small>/100</small></strong></div>
        <div class="metric-cell"><span>余味指数</span><strong>${arc[arc.length - 1].value}<small>/100</small></strong></div>
      </div>
      <div class="analysis-sub">
        <h4>情绪是怎么被推高的</h4>
        <p>${escapeHTML(idea.emotion.note)}</p>
      </div>
      <div class="analysis-sub">
        <h4>视觉母题</h4>
        <p>${escapeHTML(idea.motif)}</p>
      </div>
    `;
  }

  function emotionChart(arc, peakIndex) {
    const width = 340;
    const height = 150;
    const padX = 22;
    const padTop = 18;
    const padBottom = 24;
    const chartHeight = height - padTop - padBottom;
    const points = arc.map((item, index) => ({
      x: padX + (index * (width - padX * 2)) / (arc.length - 1),
      y: padTop + (1 - item.value / 100) * chartHeight
    }));

    let line = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let index = 1; index < points.length; index += 1) {
      const prev = points[index - 1];
      const current = points[index];
      const midX = (prev.x + current.x) / 2;
      line += ` C ${midX.toFixed(2)} ${prev.y.toFixed(2)}, ${midX.toFixed(2)} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
    }
    const baseY = height - padBottom;
    const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${baseY} L ${points[0].x.toFixed(2)} ${baseY} Z`;
    const id = `emotion-${++chartSeq}`;
    const peak = points[peakIndex];

    return `
      <div class="emotion-chart" aria-label="情绪曲线">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="从${escapeHTML(arc[0].label)}到${escapeHTML(arc[arc.length - 1].label)}的情绪曲线">
          <defs>
            <linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#dda65e" stop-opacity=".22"/>
              <stop offset="1" stop-color="#dda65e" stop-opacity="0"/>
            </linearGradient>
            <radialGradient id="${id}-dot">
              <stop offset="0" stop-color="#f1c17a" stop-opacity=".45"/>
              <stop offset="1" stop-color="#f1c17a" stop-opacity="0"/>
            </radialGradient>
          </defs>
          ${[0.25, 0.5, 0.75].map((ratio) => `<line x1="${padX}" x2="${width - padX}" y1="${padTop + chartHeight * ratio}" y2="${padTop + chartHeight * ratio}" stroke="#f0e8da" stroke-opacity=".07" stroke-dasharray="2 5"/>`).join('')}
          <path d="${area}" fill="url(#${id}-fill)"/>
          <path d="${line}" fill="none" stroke="#dda65e" stroke-width="1.4" stroke-linecap="round"/>
          ${points.map((point, index) => `
            <circle cx="${point.x}" cy="${point.y}" r="${index === peakIndex ? 3 : 1.6}" fill="${index === peakIndex ? '#f1c17a' : '#dda65e'}" stroke="${index === peakIndex ? '#171713' : 'none'}" stroke-width="1"/>
          `).join('')}
          <circle cx="${peak.x}" cy="${peak.y}" r="14" fill="url(#${id}-dot)"/>
          <line x1="${peak.x}" x2="${peak.x}" y1="${peak.y + 7}" y2="${baseY}" stroke="#f0e8da" stroke-opacity=".12" stroke-dasharray="2 4"/>
          <text x="${peak.x}" y="${peak.y - 9}" text-anchor="middle" fill="#f1c17a" font-size="7" font-family="Bahnschrift, sans-serif">${arc[peakIndex].value}</text>
          <text x="${padX}" y="${height - 7}" fill="#6f6a60" font-size="6.5" font-family="Bahnschrift, sans-serif">START</text>
          <text x="${width - padX}" y="${height - 7}" text-anchor="end" fill="#6f6a60" font-size="6.5" font-family="Bahnschrift, sans-serif">AFTER</text>
        </svg>
        <div class="chart-axis">
          <span>${escapeHTML(arc[0].label)}</span>
          <span>${escapeHTML(arc[peakIndex].label)} · 峰值</span>
          <span>${escapeHTML(arc[arc.length - 1].label)}</span>
        </div>
      </div>
    `;
  }

  function characterTabTemplate(idea) {
    const characters = idea.characters;
    const index = clamp(state.characterIndex, 0, characters.length - 1);
    const character = characters[index];
    return `
      <div class="char-switch" role="tablist" aria-label="人物选择">
        ${characters.map((item, itemIndex) => `
          <button type="button" class="${itemIndex === index ? 'is-active' : ''}" data-character-index="${itemIndex}" style="--avatar:${item.color}" role="tab" aria-selected="${itemIndex === index}">
            <span class="mini-avatar">${escapeHTML(item.initial)}</span>
            ${escapeHTML(item.name)}
          </button>
        `).join('')}
      </div>
      <div class="char-profile">
        <div class="char-avatar" style="--avatar:${character.color}">${escapeHTML(character.initial)}</div>
        <div>
          <h3 class="char-name">${escapeHTML(character.name)}</h3>
          <p class="char-role">${escapeHTML(character.role)}</p>
        </div>
      </div>
      <p class="char-quote">${escapeHTML(character.quote)}</p>
      <div class="char-facts">
        <div class="char-fact"><dt>外在欲望 / WANT</dt><dd>${escapeHTML(character.want)}</dd></div>
        <div class="char-fact"><dt>内在需要 / NEED</dt><dd>${escapeHTML(character.need)}</dd></div>
        <div class="char-fact"><dt>恐惧 / FEAR</dt><dd>${escapeHTML(character.fear)}</dd></div>
        <div class="char-fact"><dt>秘密 / SECRET</dt><dd>${escapeHTML(character.secret)}</dd></div>
      </div>
      <div class="growth-card">
        <div class="growth-head"><span>CHARACTER ARC / 人物成长</span><small>从防御到松动</small></div>
        <div class="growth-track">
          <div class="growth-step"><span>起点</span><p>${escapeHTML(character.growth.start)}</p></div>
          <div class="growth-arrow" aria-hidden="true">→</div>
          <div class="growth-step"><span>转折</span><p>${escapeHTML(character.growth.turn)}</p></div>
          <div class="growth-arrow" aria-hidden="true">→</div>
          <div class="growth-step"><span>终点</span><p>${escapeHTML(character.growth.end)}</p></div>
        </div>
      </div>
    `;
  }

  function diagnosisTabTemplate(idea) {
    return `
      <div class="diag-top">
        <div class="score-ring" style="--score:${idea.diagnosis.score}%"><strong>${idea.diagnosis.score}<small>/100</small></strong></div>
        <div>
          <h3>结构完成度</h3>
          <p>基于 12 项叙事指标的综合判断，不是评分，是下一步修改的坐标。</p>
        </div>
      </div>
      <div class="diag-block">
        <h4>成立之处</h4>
        <ul>${idea.diagnosis.strengths.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
      </div>
      <div class="diag-block is-risk">
        <h4>风险与修正</h4>
        <ul>${idea.diagnosis.risks.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
      </div>
      <div class="theme-card">
        <span>THEME / 主题锚点</span>
        <p>${escapeHTML(idea.theme)}</p>
      </div>
      <div class="suggestion">
        <span>AI 建议 / NEXT DRAFT</span>
        <p>${escapeHTML(idea.diagnosis.suggestion)}</p>
      </div>
    `;
  }

  function switchAnalysisTab(tab) {
    if (!['emotion', 'character', 'diagnosis'].includes(tab)) return;
    state.analysisTab = tab;
    $$('.analysis-tab').forEach((button) => {
      const active = button.dataset.analysisTab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const content = $('#analysisContent');
    const idea = getSelectedIdea();
    if (!content || !idea) return;
    content.classList.remove('is-switching');
    void content.offsetWidth;
    content.classList.add('is-switching');
    content.innerHTML = renderAnalysisContent(idea, tab);
    persist();
  }

  function switchCharacter(index) {
    const idea = getSelectedIdea();
    if (!idea) return;
    state.characterIndex = clamp(index, 0, idea.characters.length - 1);
    state.analysisTab = 'character';
    const content = $('#analysisContent');
    if (!content) return;
    $$('.analysis-tab').forEach((button) => {
      const active = button.dataset.analysisTab === 'character';
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    content.classList.remove('is-switching');
    void content.offsetWidth;
    content.classList.add('is-switching');
    content.innerHTML = characterTabTemplate(idea);
    persist();
  }

  /* ---------------------------------------------------------
     export + modal
     --------------------------------------------------------- */

  function buildMarkdown() {
    const idea = getSelectedIdea();
    const outline = ensureOutline();
    if (!idea || !outline) return '';

    const lines = [
      `# 《${idea.title}》剧本大纲`,
      '',
      `> ${idea.logline}`,
      '',
      `- **英文片名**：${idea.english}`,
      `- **片长**：${getDuration().label}（预计 ${formatDuration(outline.totalSeconds)}）`,
      `- **题材**：${idea.genres.join(' / ')}`,
      `- **叙事倾向**：${getTone().label} · ${getTone().note}`,
      `- **核心情绪**：${idea.emotion.core}`,
      `- **主题**：${idea.theme}`,
      '',
      '---',
      '',
      '## 结构大纲',
      ''
    ];

    outline.acts.forEach((act) => {
      lines.push(`### ${act.name} · ${act.title}（${formatClock(act.start)} – ${formatClock(act.end)}）`);
      lines.push('');
      act.scenes.forEach((scene) => {
        lines.push(`#### ${pad2(scene.number)} ${scene.title}`);
        lines.push(`- 时间：${formatClock(scene.start)} – ${formatClock(scene.end)}`);
        lines.push(`- 地点：${scene.place}`);
        lines.push(`- 动作：${scene.action}`);
        lines.push(`- 转折：${scene.turn}`);
        lines.push(`- 场景功能：${scene.purpose}`);
        lines.push(`- 视觉母题：${scene.visual}`);
        lines.push('');
      });
    });

    lines.push('---', '', '## AI 大纲分析', '', '### 核心情绪', '', idea.emotion.core, '', idea.emotion.note, '');
    lines.push('### 人物分析', '');
    idea.characters.forEach((character) => {
      lines.push(`#### ${character.name} · ${character.role}`);
      lines.push(`- 外在欲望：${character.want}`);
      lines.push(`- 内在需要：${character.need}`);
      lines.push(`- 恐惧：${character.fear}`);
      lines.push(`- 秘密：${character.secret}`);
      lines.push(`- 人物成长：${character.growth.start} → ${character.growth.turn} → ${character.growth.end}`);
      lines.push('');
    });
    lines.push('### 结构诊断', '');
    lines.push(`结构完成度：${idea.diagnosis.score} / 100`, '');
    lines.push('成立之处：');
    idea.diagnosis.strengths.forEach((item) => lines.push(`- ${item}`));
    lines.push('', '风险与修正：');
    idea.diagnosis.risks.forEach((item) => lines.push(`- ${item}`));
    lines.push('', `AI 建议：${idea.diagnosis.suggestion}`, '');
    lines.push('---', '', `由 幕间 MIJIAN · AI 编剧共创空间 生成 · ${new Date().toLocaleDateString('zh-CN')}`);

    return lines.join('\n');
  }

  function exportOutline() {
    const idea = getSelectedIdea();
    if (!idea || !state.outline) {
      showToast('还没有可导出的大纲。');
      return;
    }
    const markdown = buildMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `《${idea.title}》剧本大纲.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('大纲已导出为 Markdown 文件。');
  }

  function closeModal() {
    const modal = $('#modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openResetModal() {
    const modal = $('#modal');
    if (!modal) return;
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="resetTitle">
        <button type="button" class="modal-close" data-action="close-modal" aria-label="关闭">
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <span class="kicker">NEW STORY / 01</span>
        <h2 id="resetTitle">开始一个新故事？</h2>
        <p>当前的创意、大纲、剧本和制作包都会被清空。这个原型不会把内容同步到云端。</p>
        <div class="modal-actions">
          <button type="button" class="ghost-btn" data-action="close-modal">继续当前故事</button>
          <button type="button" class="primary-btn" data-action="confirm-reset">开始新故事</button>
        </div>
      </div>
    `;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function resetAll() {
    ideasToken += 1;
    processToken += 1;
    state.durationId = 'medium';
    state.genres = ['科幻', '悬疑'];
    state.tone = 'balanced';
    state.ideas = [];
    state.selectedId = null;
    state.outline = null;
    state.production = null;
    state.analysisTab = 'emotion';
    state.characterIndex = 0;
    state.productionTab = 'script';
    state.storyboardScene = 'all';
    closeModal();
    hideProcess();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* no-op */
    }
    renderSetup();
    scrollTop();
    showToast('已经准备好一张新的白纸。');
  }

  /* ---------------------------------------------------------
     persistence + routing
     --------------------------------------------------------- */

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stage: state.stage,
        durationId: state.durationId,
        genres: state.genres,
        tone: state.tone,
        selectedId: state.selectedId,
        analysisTab: state.analysisTab,
        characterIndex: state.characterIndex,
        productionTab: state.productionTab,
        storyboardScene: state.storyboardScene
      }));
    } catch (error) {
      /* localStorage can be unavailable; the prototype still works in memory. */
    }
  }

  function restoreSession() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      return false;
    }
    if (!saved || typeof saved !== 'object') return false;

    if (DURATIONS.some((item) => item.id === saved.durationId)) state.durationId = saved.durationId;
    if (Array.isArray(saved.genres)) {
      const valid = saved.genres.filter((genre) => GENRES.some((item) => item.name === genre)).slice(0, 3);
      if (valid.length) state.genres = valid;
    }
    if (TONES.some((item) => item.id === saved.tone)) state.tone = saved.tone;
    if (['emotion', 'character', 'diagnosis'].includes(saved.analysisTab)) state.analysisTab = saved.analysisTab;
    if (Number.isInteger(saved.characterIndex)) state.characterIndex = saved.characterIndex;
    if (['script', 'characters', 'storyboard', 'manifest'].includes(saved.productionTab)) state.productionTab = saved.productionTab;
    if (saved.storyboardScene === 'all' || Number.isInteger(saved.storyboardScene)) state.storyboardScene = saved.storyboardScene;

    const ranked = getRankedIdeas();
    if (!ranked.length) return false;

    if (saved.stage === 'production') {
      const idea = ranked.find((item) => item.id === saved.selectedId);
      if (idea) {
        state.ideas = ranked;
        state.selectedId = idea.id;
        state.outline = buildOutline(idea);
        state.production = buildProduction(idea, state.outline);
        renderProduction();
        return true;
      }
    }

    if (saved.stage === 'outline') {
      const idea = ranked.find((item) => item.id === saved.selectedId);
      if (idea) {
        state.ideas = ranked;
        state.selectedId = idea.id;
        state.outline = buildOutline(idea);
        renderOutline();
        return true;
      }
    }

    if (saved.stage === 'ideas') {
      state.ideas = ranked;
      state.selectedId = ranked.some((item) => item.id === saved.selectedId) ? saved.selectedId : null;
      renderIdeas();
      return true;
    }

    return false;
  }

  function applyDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const stage = params.get('stage');
    if (!['ideas', 'outline', 'production'].includes(stage)) return false;

    const durationParam = params.get('duration');
    if (DURATIONS.some((item) => item.id === durationParam)) state.durationId = durationParam;

    const genreParam = params.get('genres');
    if (genreParam) {
      const parsed = genreParam
        .split(/[,，/|]+/)
        .map((item) => item.trim())
        .filter((genre) => GENRES.some((item) => item.name === genre))
        .slice(0, 3);
      if (parsed.length) state.genres = parsed;
    }

    const toneParam = params.get('tone');
    if (TONES.some((item) => item.id === toneParam)) state.tone = toneParam;

    const requestedIdeaId = params.get('idea');
    const requestedIdea = IDEAS.find((item) => item.id === requestedIdeaId);

    if (stage === 'production') {
      if (!requestedIdea) return false;
      state.genres = [...requestedIdea.genres];
      state.ideas = rankIdeas(IDEAS.filter((item) => item.pack === requestedIdea.pack));
      state.selectedId = requestedIdea.id;
      state.outline = buildOutline(requestedIdea);
      state.production = buildProduction(requestedIdea, state.outline);
      state.productionTab = ['script', 'characters', 'storyboard', 'manifest'].includes(params.get('tab'))
        ? params.get('tab')
        : 'script';
      const sceneParam = Number(params.get('scene'));
      state.storyboardScene = Number.isInteger(sceneParam) && sceneParam > 0 ? sceneParam : 'all';
      renderProduction();
      return true;
    }

    if (stage === 'outline') {
      if (!requestedIdea) return false;
      state.genres = [...requestedIdea.genres];
      state.ideas = rankIdeas(IDEAS.filter((item) => item.pack === requestedIdea.pack));
      state.selectedId = requestedIdea.id;
      state.outline = buildOutline(requestedIdea);
      state.analysisTab = ['emotion', 'character', 'diagnosis'].includes(params.get('tab')) ? params.get('tab') : 'emotion';
      state.characterIndex = Number(params.get('character')) || 0;
      renderOutline();
      return true;
    }

    state.ideas = getRankedIdeas();
    state.selectedId = state.ideas.some((item) => item.id === requestedIdeaId) ? requestedIdeaId : null;
    renderIdeas();
    return true;
  }

  /* ---------------------------------------------------------
     poster artwork
     --------------------------------------------------------- */

  function posterSVG(idea) {
    const p = idea.palette;
    const id = `poster${++posterSeq}`;
    return `
      <svg viewBox="0 0 640 294" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeHTML(idea.title)} 概念海报">
        <defs>
          <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${p.bg1}"/>
            <stop offset=".62" stop-color="${p.bg2}"/>
            <stop offset="1" stop-color="${p.bg1}"/>
          </linearGradient>
          <radialGradient id="${id}-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="${p.accent}" stop-opacity=".55"/>
            <stop offset=".52" stop-color="${p.accent}" stop-opacity=".14"/>
            <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#000" stop-opacity="0"/>
            <stop offset="1" stop-color="#000" stop-opacity=".45"/>
          </linearGradient>
          <filter id="${id}-blur"><feGaussianBlur stdDeviation="18"/></filter>
        </defs>
        <rect width="640" height="294" fill="url(#${id}-bg)"/>
        <ellipse cx="${p.accent === '#ff6673' ? 520 : 430}" cy="132" rx="230" ry="180" fill="url(#${id}-glow)"/>
        <g stroke="${p.ink}" stroke-opacity=".05" stroke-width="1">
          <path d="M80 0v294M160 0v294M240 0v294M320 0v294M400 0v294M480 0v294M560 0v294"/>
          <path d="M0 49h640M0 98h640M0 147h640M0 196h640M0 245h640"/>
        </g>
        <g stroke="${p.ink}" stroke-opacity=".42" stroke-width="1" fill="none">
          <path d="M22 22h18M22 22v18M618 22h-18M618 22v18M22 272h18M22 272v-18M618 272h-18M618 272v-18"/>
        </g>
        ${posterArtwork(idea, id)}
        <rect width="640" height="294" fill="url(#${id}-fade)"/>
      </svg>
    `;
  }

  function posterArtwork(idea, id) {
    const p = idea.palette;
    switch (idea.art) {
      case 'depth':
        return `
          <g>
            <polygon points="382,0 410,0 505,294 420,294" fill="${p.accent}" opacity=".035"/>
            <circle cx="450" cy="128" r="112" fill="none" stroke="${p.accent}" stroke-opacity=".26"/>
            <circle cx="450" cy="128" r="94" fill="none" stroke="${p.accent}" stroke-opacity=".5"/>
            <circle cx="450" cy="128" r="75" fill="${p.bg1}" fill-opacity=".48" stroke="${p.accent}" stroke-opacity=".2" stroke-dasharray="2 7"/>
            <circle cx="450" cy="128" r="48" fill="none" stroke="${p.ink}" stroke-opacity=".1"/>
            <path d="M356 128h188M450 34v188" stroke="${p.ink}" stroke-opacity=".1"/>
            <path d="M450 222v72" stroke="${p.accent}" stroke-opacity=".35" stroke-dasharray="2 6"/>
            <circle cx="394" cy="92" r="3.4" fill="none" stroke="${p.accent}" stroke-opacity=".55"/>
            <circle cx="402" cy="74" r="1.8" fill="${p.accent}" fill-opacity=".65"/>
            <circle cx="381" cy="66" r="2.4" fill="none" stroke="${p.accent}" stroke-opacity=".35"/>
            <circle cx="500" cy="170" r="2" fill="${p.accent}" fill-opacity=".5"/>
            <path d="M0 252C130 228 230 260 355 246S530 220 640 238" fill="none" stroke="${p.accent}" stroke-opacity=".2"/>
            <path d="M0 262C150 242 250 270 385 254S550 238 640 248" fill="none" stroke="${p.ink}" stroke-opacity=".08"/>
            <circle cx="560" cy="82" r="1.2" fill="${p.warm}" fill-opacity=".7"/>
            <circle cx="580" cy="104" r=".9" fill="${p.warm}" fill-opacity=".45"/>
          </g>
        `;
      case 'signal':
        const wave = [154,154,148,160,142,166,138,172,150,158,132,178,145,165,152,156,120,184,149,161,143,169,150,158,130,176,146,164,154,154];
        const points = wave.map((y, index) => `${(22 + index * 20.5).toFixed(1)},${y}`).join(' ');
        return `
          <g>
            <circle cx="438" cy="132" r="112" fill="none" stroke="${p.accent}" stroke-opacity=".2"/>
            <circle cx="438" cy="132" r="86" fill="none" stroke="${p.accent}" stroke-opacity=".32" stroke-dasharray="2 6"/>
            <circle cx="438" cy="132" r="61" fill="none" stroke="${p.accent}" stroke-opacity=".12"/>
            <circle cx="438" cy="132" r="4" fill="${p.warm}" opacity=".8"/>
            <polyline points="${points}" fill="none" stroke="${p.accent}" stroke-opacity=".72" stroke-width="1.4"/>
            <polyline points="${points}" fill="none" stroke="${p.accent}" stroke-opacity=".15" stroke-width="9" transform="translate(0 8)" filter="url(#${id}-blur)"/>
            <g fill="${p.accent}" opacity=".22">
              ${Array.from({ length: 32 }, (_, index) => {
                const height = 6 + Math.abs(Math.sin(index * 1.7)) * 34;
                return `<rect x="${18 + index * 19.4}" y="${238 - height}" width="2" height="${height}"/>`;
              }).join('')}
            </g>
            <path d="M22 238h596" stroke="${p.ink}" stroke-opacity=".18"/>
            <path d="M438 20v224" stroke="${p.ink}" stroke-opacity=".08" stroke-dasharray="2 8"/>
            <circle cx="552" cy="66" r="3" fill="${p.warm}" opacity=".8"/>
            <circle cx="552" cy="66" r="17" fill="none" stroke="${p.warm}" stroke-opacity=".22"/>
          </g>
        `;
      case 'paper':
        return `
          <g>
            <circle cx="479" cy="92" r="70" fill="${p.ink}" opacity=".9"/>
            <circle cx="479" cy="92" r="70" fill="none" stroke="${p.warm}" stroke-opacity=".3"/>
            <circle cx="458" cy="78" r="9" fill="${p.bg2}" opacity=".18"/>
            <circle cx="500" cy="112" r="6" fill="${p.bg2}" opacity=".15"/>
            <polygon points="0,214 88,135 176,206 268,148 358,216 436,161 520,219 598,171 640,198 640,294 0,294" fill="${p.bg1}" fill-opacity=".72"/>
            <polygon points="0,246 110,190 208,242 300,200 404,250 500,211 610,252 640,236 640,294 0,294" fill="${p.warm}" fill-opacity=".16"/>
            <path d="M0 246C100 225 182 258 286 238S474 216 640 246" fill="none" stroke="${p.ink}" stroke-opacity=".18"/>
            <path d="M278 88l24-11-9 18 15 11-21-4-8 15-2-19-19-3 20-7Z" fill="${p.ink}" opacity=".9"/>
            <path d="M312 102c22 2 39 11 52 26" fill="none" stroke="${p.ink}" stroke-opacity=".25" stroke-dasharray="2 5"/>
            <g transform="translate(548 181)">
              <rect width="32" height="32" fill="none" stroke="${p.warm}" stroke-opacity=".65"/>
              <path d="M8 8h16M8 14h10M8 20h16M8 26h12" stroke="${p.warm}" stroke-opacity=".5"/>
            </g>
            <circle cx="144" cy="65" r="1.4" fill="${p.ink}" opacity=".5"/>
            <circle cx="172" cy="52" r="1" fill="${p.ink}" opacity=".35"/>
            <path d="M80 60h54M80 67h35" stroke="${p.ink}" stroke-opacity=".14"/>
          </g>
        `;
      case 'radio':
        return `
          <g>
            <g fill="${p.bg1}" opacity=".78">
              <rect x="0" y="205" width="42" height="89"/>
              <rect x="48" y="178" width="38" height="116"/>
              <rect x="92" y="218" width="46" height="76"/>
              <rect x="144" y="190" width="34" height="104"/>
              <rect x="184" y="224" width="58" height="70"/>
              <rect x="248" y="198" width="44" height="96"/>
              <rect x="298" y="170" width="36" height="124"/>
              <rect x="340" y="214" width="52" height="80"/>
              <rect x="398" y="188" width="40" height="106"/>
              <rect x="444" y="216" width="44" height="78"/>
              <rect x="494" y="194" width="32" height="100"/>
              <rect x="532" y="222" width="58" height="72"/>
              <rect x="596" y="186" width="44" height="108"/>
            </g>
            <g stroke="${p.ink}" stroke-opacity=".15">
              <path d="M0 238h640M0 258h640"/>
            </g>
            <g opacity=".7">
              <path d="M522 196V92M506 112l16-20 16 20M512 128l10-16 10 16" stroke="${p.accent}" stroke-opacity=".55" fill="none"/>
              <circle cx="522" cy="82" r="3" fill="${p.warm}"/>
              <circle cx="522" cy="82" r="19" fill="none" stroke="${p.warm}" stroke-opacity=".18"/>
              <circle cx="522" cy="82" r="38" fill="none" stroke="${p.accent}" stroke-opacity=".1" stroke-dasharray="2 5"/>
            </g>
            <g>
              <rect x="58" y="64" width="94" height="54" rx="2" fill="none" stroke="${p.accent}" stroke-opacity=".38"/>
              <circle cx="79" cy="81" r="5" fill="${p.warm}" opacity=".8"/>
              <path d="M93 78h42M93 87h29M68 103h73" stroke="${p.ink}" stroke-opacity=".28"/>
              <text x="68" y="112" fill="${p.accent}" opacity=".6" font-size="6" font-family="Bahnschrift, sans-serif">ON AIR / 00:47</text>
            </g>
            <g stroke="${p.warm}" stroke-opacity=".32">
              <path d="M366 231h84M374 224v14M388 224v14M402 224v14M416 224v14M430 224v14M444 224v14"/>
            </g>
            <circle cx="604" cy="58" r="1.5" fill="${p.warm}" opacity=".6"/>
            <circle cx="624" cy="92" r="1" fill="${p.accent}" opacity=".4"/>
          </g>
        `;
      case 'lost':
        return `
          <g>
            <polygon points="402,0 512,0 572,294 328,294" fill="${p.accent}" opacity=".045"/>
            <g transform="translate(346 34)" stroke="${p.accent}" stroke-opacity=".3" fill="none">
              <rect x="0" y="0" width="238" height="216" rx="2"/>
              <path d="M0 54h238M0 108h238M0 162h238M0 216h238"/>
              <path d="M78 0v216M158 0v216"/>
            </g>
            <g opacity=".8">
              <rect x="376" y="54" width="44" height="30" fill="${p.bg1}" stroke="${p.accent}" stroke-opacity=".45"/>
              <path d="M382 54v-15h20v15" stroke="${p.accent}" stroke-opacity=".3" fill="none"/>
              <rect x="468" y="106" width="56" height="34" fill="${p.bg1}" stroke="${p.accent}" stroke-opacity=".32"/>
              <rect x="390" y="162" width="36" height="28" fill="${p.bg1}" stroke="${p.accent}" stroke-opacity=".25"/>
              <path d="M510 54v40M510 54h22" stroke="${p.accent}" stroke-opacity=".4" fill="none"/>
              <rect x="500" y="94" width="20" height="26" fill="${p.warm}" fill-opacity=".18" stroke="${p.warm}" stroke-opacity=".35"/>
              <circle cx="510" cy="94" r="2" fill="${p.warm}" opacity=".8"/>
              <path d="M444 174v22h20" stroke="${p.accent}" stroke-opacity=".35" fill="none"/>
              <circle cx="444" cy="196" r="2" fill="${p.accent}" opacity=".55"/>
            </g>
            <g fill="${p.ink}" opacity=".22">
              <circle cx="238" cy="74" r="1.4"/>
              <circle cx="270" cy="104" r="1"/>
              <circle cx="214" cy="126" r=".8"/>
              <circle cx="300" cy="52" r="1.1"/>
            </g>
            <path d="M0 256h640" stroke="${p.ink}" stroke-opacity=".1"/>
            <path d="M0 262h640" stroke="${p.ink}" stroke-opacity=".05"/>
          </g>
        `;
      case 'store':
        return `
          <g>
            <rect x="354" y="66" width="248" height="176" fill="${p.bg1}" fill-opacity=".55" stroke="${p.accent}" stroke-opacity=".35"/>
            <rect x="354" y="66" width="248" height="19" fill="${p.accent}" opacity=".18"/>
            <path d="M354 85h248M354 143h248M354 201h248M433 66v176M513 66v176" stroke="${p.accent}" stroke-opacity=".2"/>
            <g fill="${p.ink}" opacity=".55">
              <rect x="370" y="102" width="18" height="25"/><rect x="392" y="108" width="12" height="19"/>
              <rect x="446" y="98" width="21" height="29"/><rect x="471" y="112" width="10" height="15"/>
              <rect x="528" y="104" width="16" height="23"/><rect x="548" y="96" width="22" height="31"/>
              <rect x="370" y="160" width="25" height="22"/><rect x="401" y="166" width="12" height="16"/>
              <rect x="446" y="154" width="18" height="28"/><rect x="468" y="168" width="11" height="14"/>
              <rect x="528" y="158" width="22" height="24"/><rect x="554" y="150" width="13" height="32"/>
            </g>
            <g fill="${p.bg1}">
              <circle cx="380" cy="127" r="7"/>
              <path d="M369 143c0-8 5-13 11-13s11 5 11 13" />
            </g>
            <g fill="${p.warm}" opacity=".85">
              <circle cx="478" cy="132" r="8"/>
              <path d="M466 150c0-9 5-15 12-15s12 6 12 15"/>
            </g>
            <g stroke="${p.accent}" stroke-opacity=".28">
              <path d="M20 20l-8 22M58 0l-10 28M98 10l-7 20M144 0l-12 32M188 14l-6 18M232 0l-9 26M270 18l-6 16M314 2l-10 27M92 60l-8 22M172 72l-7 19M252 52l-10 28M312 92l-7 17M32 118l-8 23M122 132l-7 18M202 112l-9 26M288 150l-6 16M72 188l-8 22M172 196l-7 18M252 178l-9 25M330 214l-6 16"/>
            </g>
            <path d="M0 264c120-8 240 8 360-2s200-10 280 2" fill="none" stroke="${p.accent}" stroke-opacity=".15"/>
            <circle cx="584" cy="44" r="1.4" fill="${p.warm}" opacity=".6"/>
          </g>
        `;
      case 'stage':
        return `
          <g>
            <polygon points="314,-30 458,-30 582,294 224,294" fill="${p.accent}" opacity=".07"/>
            <polygon points="350,-20 410,-20 468,294 286,294" fill="${p.accent}" opacity=".04"/>
            <ellipse cx="408" cy="260" rx="132" ry="18" fill="#000" opacity=".28"/>
            <g fill="${p.bg1}">
              <circle cx="414" cy="112" r="28"/>
              <path d="M380 250c0-74 14-112 34-112s34 38 34 112H380Z"/>
              <path d="M399 156l-20 56 13 6 24-52M429 156l23 52-12 8-27-48" />
            </g>
            <path d="M380 250c0-74 14-112 34-112s34 38 34 112" fill="none" stroke="${p.warm}" stroke-opacity=".22"/>
            <g transform="translate(56 186) rotate(-6)" stroke="${p.accent}" stroke-opacity=".5" fill="${p.bg1}" fill-opacity=".65">
              <rect width="114" height="62" rx="2"/>
              <path d="M0 17h114M24 0v17M56 0v17M88 0v17"/>
              <path d="M12 32h78M12 44h56" stroke-opacity=".22"/>
            </g>
            <g stroke="${p.warm}" stroke-opacity=".35">
              <path d="M530 86l72 0M550 102l42 0M564 118l22 0"/>
            </g>
            <g fill="${p.warm}" opacity=".5">
              <circle cx="510" cy="54" r="1.3"/><circle cx="548" cy="38" r=".9"/><circle cx="578" cy="60" r="1"/>
              <circle cx="476" cy="72" r=".8"/><circle cx="598" cy="94" r="1.2"/><circle cx="338" cy="56" r=".8"/>
            </g>
            <path d="M0 274c100-6 200 6 320-2s220-8 320 0" fill="none" stroke="${p.ink}" stroke-opacity=".08"/>
          </g>
        `;
      case 'moon':
        return `
          <g>
            <circle cx="466" cy="104" r="84" fill="${p.ink}" opacity=".93"/>
            <circle cx="440" cy="84" r="11" fill="${p.bg2}" opacity=".13"/>
            <circle cx="495" cy="124" r="7" fill="${p.bg2}" opacity=".11"/>
            <circle cx="508" cy="78" r="4" fill="${p.bg2}" opacity=".09"/>
            <circle cx="466" cy="104" r="84" fill="none" stroke="${p.accent}" stroke-opacity=".3"/>
            <ellipse cx="466" cy="230" rx="104" ry="10" fill="${p.accent}" opacity=".08"/>
            <g stroke="${p.accent}" stroke-opacity=".25">
              <path d="M356 236c30-14 58-14 86 0M410 244c24-8 48-8 72 0M456 252c18-5 36-5 54 0"/>
            </g>
            <g>
              <rect x="0" y="258" width="640" height="36" fill="${p.bg1}" opacity=".85"/>
              <path d="M0 258h640M0 270h640M0 282h640" stroke="${p.ink}" stroke-opacity=".08"/>
              <path d="M62 258v36M120 258v36M178 258v36M236 258v36M294 258v36M352 258v36M410 258v36M468 258v36M526 258v36M584 258v36" stroke="${p.ink}" stroke-opacity=".08"/>
            </g>
            <g transform="translate(108 178)">
              <path d="M20 49V30a20 20 0 0 1 40 0v19" fill="none" stroke="${p.warm}" stroke-opacity=".45"/>
              <path d="M0 30c0-18 14-30 40-30s40 12 40 30" fill="${p.warm}" fill-opacity=".1" stroke="${p.warm}" stroke-opacity=".32"/>
              <circle cx="40" cy="54" r="7" fill="${p.bg1}" stroke="${p.warm}" stroke-opacity=".35"/>
              <path d="M33 75c0-10 3-16 7-16s7 6 7 16" fill="${p.bg1}" stroke="${p.warm}" stroke-opacity=".3"/>
            </g>
            <g stroke="${p.accent}" stroke-opacity=".18">
              <path d="M18 12l-7 18M80 0l-6 16M150 18l-8 20M220 2l-5 14M300 22l-7 18M360 0l-4 12M580 8l-7 20M612 42l-5 14"/>
            </g>
            <circle cx="576" cy="68" r="1.3" fill="${p.accent}" opacity=".5"/>
            <circle cx="600" cy="46" r=".8" fill="${p.accent}" opacity=".4"/>
          </g>
        `;
      default:
        return '';
    }
  }

  /* ---------------------------------------------------------
     events
     --------------------------------------------------------- */

  function handleAction(action, element) {
    switch (action) {
      case 'toggle-theme':
        applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
        break;
      case 'generate':
        generateIdeas();
        break;
      case 'go-setup':
        renderSetup();
        scrollTop();
        break;
      case 'to-outline':
        startOutline();
        break;
      case 'to-production':
        startProduction();
        break;
      case 'back-outline':
        if (state.outline) {
          renderOutline();
          scrollTop();
        } else if (state.selectedId) {
          startOutline();
        }
        break;
      case 'export-script':
        exportScript();
        break;
      case 'export-package':
        exportProductionPackage();
        break;
      case 'clear-selection':
        clearSelection();
        break;
      case 'back-ideas':
        if (state.ideas.length) {
          renderIdeas();
          scrollTop();
        } else {
          renderSetup();
        }
        break;
      case 'jump-analysis': {
        const panel = $('.analysis-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'export':
        exportOutline();
        break;
      case 'close-modal':
        closeModal();
        break;
      case 'reset':
        if (state.stage === 'setup' && !state.ideas.length) resetAll();
        else openResetModal();
        break;
      case 'confirm-reset':
        resetAll();
        break;
      case 'home':
        renderSetup();
        scrollTop();
        break;
      case 'skip-process':
        skipProcess();
        break;
      default:
        break;
    }
  }

  document.addEventListener('click', (event) => {
    const stepButton = event.target.closest('.stepper [data-step]');
    if (stepButton) {
      const step = stepButton.dataset.step;
      if (step === 'setup') {
        renderSetup();
        scrollTop();
      } else if (step === 'ideas') {
        if (state.ideas.length) {
          renderIdeas();
          scrollTop();
        } else {
          showToast('先设定片长与题材，生成创意后才能进入这一步。');
        }
      } else if (step === 'outline') {
        if (state.outline) {
          renderOutline();
          scrollTop();
        } else if (state.selectedId) {
          startOutline();
        } else {
          showToast('请先从四个创意中选择一个方向。');
        }
      } else if (step === 'production') {
        if (state.production) {
          renderProduction();
          scrollTop();
        } else if (state.outline) {
          startProduction();
        } else {
          showToast('先生成剧本大纲，再进入剧本与制作阶段。');
        }
      }
      return;
    }

    const actionElement = event.target.closest('[data-action]');
    if (actionElement) {
      handleAction(actionElement.dataset.action, actionElement);
      return;
    }

    const durationOption = event.target.closest('[data-duration]');
    if (durationOption) {
      selectDuration(durationOption.dataset.duration);
      return;
    }

    const genreChip = event.target.closest('[data-genre]');
    if (genreChip) {
      toggleGenre(genreChip.dataset.genre);
      return;
    }

    const toneOption = event.target.closest('[data-tone]');
    if (toneOption) {
      selectTone(toneOption.dataset.tone);
      return;
    }

    const ideaCard = event.target.closest('.idea-card');
    if (ideaCard) {
      selectIdea(ideaCard.dataset.ideaId);
      return;
    }

    const analysisTab = event.target.closest('[data-analysis-tab]');
    if (analysisTab) {
      switchAnalysisTab(analysisTab.dataset.analysisTab);
      return;
    }

    const characterButton = event.target.closest('[data-character-index]');
    if (characterButton) {
      switchCharacter(Number(characterButton.dataset.characterIndex));
      return;
    }

    const productionTab = event.target.closest('[data-production-tab]');
    if (productionTab) {
      switchProductionTab(productionTab.dataset.productionTab);
      return;
    }

    const storyboardFilter = event.target.closest('[data-storyboard-filter]');
    if (storyboardFilter) {
      const value = storyboardFilter.dataset.storyboardFilter;
      state.storyboardScene = value === 'all' ? 'all' : Number(value);
      $$('.filter-chip').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.storyboardFilter === value);
      });
      const content = $('#productionContent');
      if (content) {
        content.classList.remove('is-switching');
        void content.offsetWidth;
        content.classList.add('is-switching');
        content.innerHTML = productionStoryboardTemplate();
      }
      persist();
      return;
    }

    const scriptScene = event.target.closest('[data-script-scene]');
    if (scriptScene) {
      const sceneNumber = Number(scriptScene.dataset.scriptScene);
      const target = document.getElementById(`script-scene-${sceneNumber}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $$('.script-index-item').forEach((button) => {
        button.classList.toggle('is-active', Number(button.dataset.scriptScene) === sceneNumber);
      });
      return;
    }

    const voiceButton = event.target.closest('[data-voice-index]');
    if (voiceButton) {
      toggleVoice(Number(voiceButton.dataset.voiceIndex));
      return;
    }

    const actToggle = event.target.closest('[data-act-toggle]');
    if (actToggle) {
      const act = actToggle.closest('.act');
      if (!act) return;
      const collapsed = act.classList.toggle('is-collapsed');
      actToggle.setAttribute('aria-expanded', String(!collapsed));
      return;
    }

    const sceneToggle = event.target.closest('[data-scene-toggle]');
    if (sceneToggle) {
      const scene = sceneToggle.closest('.scene');
      if (!scene) return;
      const open = scene.classList.toggle('is-open');
      sceneToggle.setAttribute('aria-expanded', String(open));
      return;
    }

    if (event.target.id === 'modal') {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const modal = $('#modal');
      if (modal?.classList.contains('is-open')) {
        closeModal();
        return;
      }
      const process = $('#process');
      if (process?.classList.contains('is-open')) {
        skipProcess();
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const card = event.target.closest?.('.idea-card');
      if (card && document.activeElement === card) {
        event.preventDefault();
        selectIdea(card.dataset.ideaId);
      }
    }
  });

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */

  function init() {
    document.body.dataset.stage = 'setup';
    updateTopbar();

    const params = new URLSearchParams(window.location.search);
    if (params.get('fresh') === '1') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* no-op */
      }
      renderSetup();
      return;
    }

    if (applyDeepLink()) return;
    if (restoreSession()) return;
    renderSetup();
  }

  init();
})();
