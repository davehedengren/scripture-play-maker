let students = [];
let studentsWithGender = [];
let visitors = [];
let castVisitors = [];

// DOM Elements
const studentList = document.getElementById('student-list');
const selectAllBtn = document.getElementById('select-all');
const clearAllBtn = document.getElementById('clear-all');
const visitorInput = document.getElementById('visitor-name');
const addVisitorBtn = document.getElementById('add-visitor');
const scriptureTitle = document.getElementById('scripture-title');
const scriptureText = document.getElementById('scripture-text');
const durationSelect = document.getElementById('duration');
const modelSelect = document.getElementById('model');
const generateBtn = document.getElementById('generate-btn');
const inputSection = document.getElementById('input-section');
const outputSection = document.getElementById('output-section');
const playDisplay = document.getElementById('play-display');
const backBtn = document.getElementById('back-btn');
const downloadBtn = document.getElementById('download-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loading-status');
const loadingTime = document.getElementById('loading-time');

const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const historyViewSection = document.getElementById('history-view-section');
const historyPlayDisplay = document.getElementById('history-play-display');
const historyBackBtn = document.getElementById('history-back-btn');
const historyDownloadBtn = document.getElementById('history-download-btn');
const historyFullscreenBtn = document.getElementById('history-fullscreen-btn');
const tabNav = document.getElementById('tab-nav');
const tabBtns = tabNav.querySelectorAll('.tab-btn');

// Templates (pre-make) tab
const templatesInputSection = document.getElementById('templates-input-section');
const tplTitle = document.getElementById('tpl-title');
const tplScripture = document.getElementById('tpl-scripture');
const tplDuration = document.getElementById('tpl-duration');
const tplCastSize = document.getElementById('tpl-cast-size');
const tplModel = document.getElementById('tpl-model');
const tplGenerateBtn = document.getElementById('tpl-generate-btn');

// Library tab
const librarySection = document.getElementById('library-section');
const libraryList = document.getElementById('library-list');
const libraryCastSection = document.getElementById('library-cast-section');
const castStudentList = document.getElementById('cast-student-list');
const castSelectAllBtn = document.getElementById('cast-select-all');
const castClearAllBtn = document.getElementById('cast-clear-all');
const castVisitorInput = document.getElementById('cast-visitor-name');
const castAddVisitorBtn = document.getElementById('cast-add-visitor');
const castTemplateTitle = document.getElementById('cast-template-title');
const castTemplateMeta = document.getElementById('cast-template-meta');
const castTemplateRoles = document.getElementById('cast-template-roles');
const castBackBtn = document.getElementById('cast-back-btn');
const castGoBtn = document.getElementById('cast-go-btn');
const castOutputSection = document.getElementById('cast-output-section');
const castWarnings = document.getElementById('cast-warnings');
const castPlayDisplay = document.getElementById('cast-play-display');
const castOutputBackBtn = document.getElementById('cast-output-back-btn');
const castOutputDownloadBtn = document.getElementById('cast-output-download-btn');
const castOutputFullscreenBtn = document.getElementById('cast-output-fullscreen-btn');

let selectedTemplate = null;
let currentCastMarkdown = '';
let currentCastTitle = '';

let timerInterval = null;
let currentMarkdown = '';
let currentTitle = '';
let currentTab = 'create';
let viewingHistoryMarkdown = '';
let viewingHistoryTitle = '';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initialize
async function init() {
  try {
    const response = await fetch('/api/students');
    const data = await response.json();
    // Support both old format (strings) and new format (objects with name/gender)
    studentsWithGender = data.map(s =>
      typeof s === 'string' ? { name: s, gender: 'M' } : { name: s.name, gender: s.gender || 'M' }
    );
    students = studentsWithGender.map(s => s.name);
  } catch (e) {
    console.error('Failed to load students:', e);
  }
  renderStudentList();
  loadSavedState();
  setupEventListeners();

  window.addEventListener('hashchange', applyHashRoute);
  applyHashRoute();
}

const VALID_TABS = ['create', 'templates', 'library', 'history'];

function applyHashRoute() {
  const hash = (window.location.hash || '').replace(/^#/, '');
  const tab = VALID_TABS.includes(hash) ? hash : 'create';
  switchTab(tab, { updateHash: false });
}

function renderStudentList() {
  studentList.innerHTML = '';

  // Regular students
  students.forEach(student => {
    const div = document.createElement('div');
    div.className = 'student-item';
    div.innerHTML = `
      <input type="checkbox" id="student-${student}" value="${student}">
      <label for="student-${student}">${student}</label>
    `;
    studentList.appendChild(div);
  });

  // Visitors
  visitors.forEach(visitor => {
    const div = document.createElement('div');
    div.className = 'student-item visitor';
    div.innerHTML = `
      <input type="checkbox" id="student-${visitor}" value="${visitor}" checked>
      <label for="student-${visitor}">${visitor} (visitor)</label>
    `;
    studentList.appendChild(div);
  });
}

function applyRosterPaste(text, listEl, opts = {}) {
  const { addUnmatchedAsVisitors, rerender, onChange } = opts;
  const pasted = text.split('\n').map(s => s.trim()).filter(Boolean);
  const pastedSet = new Set(pasted.map(n => n.toLowerCase()));

  if (addUnmatchedAsVisitors) {
    const knownNames = new Set();
    listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      knownNames.add(cb.value.toLowerCase());
    });
    const unknown = pasted.filter(n => !knownNames.has(n.toLowerCase()));
    if (unknown.length > 0) {
      addUnmatchedAsVisitors(unknown);
      if (rerender) rerender();
    }
  }

  listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = pastedSet.has(cb.value.toLowerCase());
  });

  if (onChange) onChange();
}

function setupEventListeners() {
  selectAllBtn.addEventListener('click', () => {
    studentList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    saveState();
  });

  clearAllBtn.addEventListener('click', () => {
    studentList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    saveState();
  });

  const pasteRosterEl = document.getElementById('paste-roster');
  const pasteRosterApply = document.getElementById('paste-roster-apply');
  pasteRosterApply.addEventListener('click', () => {
    applyRosterPaste(pasteRosterEl.value, studentList, {
      addUnmatchedAsVisitors: (names) => {
        names.forEach(n => { if (!visitors.includes(n)) visitors.push(n); });
      },
      rerender: renderStudentList,
      onChange: saveState
    });
  });

  const castPasteRosterEl = document.getElementById('cast-paste-roster');
  const castPasteRosterApply = document.getElementById('cast-paste-roster-apply');
  castPasteRosterApply.addEventListener('click', () => {
    applyRosterPaste(castPasteRosterEl.value, castStudentList, {
      addUnmatchedAsVisitors: (names) => {
        names.forEach(n => {
          if (!castVisitors.find(v => v.name === n)) {
            castVisitors.push({ name: n, gender: 'M' });
          }
        });
      },
      rerender: renderCastStudentList
    });
  });

  addVisitorBtn.addEventListener('click', addVisitor);
  visitorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addVisitor();
  });

  generateBtn.addEventListener('click', generatePlay);
  backBtn.addEventListener('click', showInput);
  downloadBtn.addEventListener('click', downloadScript);
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  tplGenerateBtn.addEventListener('click', generateTemplate);

  castSelectAllBtn.addEventListener('click', () => {
    castStudentList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  });
  castClearAllBtn.addEventListener('click', () => {
    castStudentList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  });
  castAddVisitorBtn.addEventListener('click', addCastVisitor);
  castVisitorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCastVisitor();
  });
  castBackBtn.addEventListener('click', () => switchTab('library'));
  castGoBtn.addEventListener('click', castSelectedTemplate);

  castOutputBackBtn.addEventListener('click', () => {
    castOutputSection.style.display = 'none';
    libraryCastSection.style.display = 'grid';
    document.body.classList.remove('fullscreen');
    castOutputFullscreenBtn.textContent = 'Present';
  });
  castOutputDownloadBtn.addEventListener('click', () => {
    if (!currentCastMarkdown) return;
    const filename = currentCastTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    const blob = new Blob([currentCastMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  castOutputFullscreenBtn.addEventListener('click', () => {
    document.body.classList.toggle('fullscreen');
    castOutputFullscreenBtn.textContent = document.body.classList.contains('fullscreen')
      ? 'Exit Fullscreen'
      : 'Present';
  });

  historyBackBtn.addEventListener('click', () => {
    historyViewSection.style.display = 'none';
    historySection.style.display = 'block';
    document.body.classList.remove('fullscreen');
    historyFullscreenBtn.textContent = 'Present';
  });

  historyDownloadBtn.addEventListener('click', () => {
    if (!viewingHistoryMarkdown) return;
    const filename = viewingHistoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    const blob = new Blob([viewingHistoryMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  historyFullscreenBtn.addEventListener('click', () => {
    document.body.classList.toggle('fullscreen');
    historyFullscreenBtn.textContent = document.body.classList.contains('fullscreen')
      ? 'Exit Fullscreen'
      : 'Present';
  });

  // Save state on changes
  studentList.addEventListener('change', saveState);
  scriptureTitle.addEventListener('input', saveState);
  scriptureText.addEventListener('input', saveState);
  durationSelect.addEventListener('change', saveState);
  modelSelect.addEventListener('change', saveState);
}

function addVisitor() {
  const name = visitorInput.value.trim();
  if (name && !students.includes(name) && !visitors.includes(name)) {
    visitors.push(name);
    renderStudentList();
    visitorInput.value = '';
    saveState();
  }
}

function getSelectedStudents() {
  const checkboxes = studentList.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
  let seconds = 0;
  loadingTime.textContent = `Elapsed: ${formatTime(seconds)}`;
  loadingStatus.textContent = 'Sending request...';

  timerInterval = setInterval(() => {
    seconds++;
    loadingTime.textContent = `Elapsed: ${formatTime(seconds)}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

async function generatePlay() {
  const selectedStudents = getSelectedStudents();
  const title = scriptureTitle.value.trim();
  const scripture = scriptureText.value.trim();
  const duration = durationSelect.value;
  const model = modelSelect.value;

  if (selectedStudents.length === 0) {
    alert('Please select at least one student');
    return;
  }

  if (!scripture) {
    alert('Please enter scripture text');
    return;
  }

  loading.style.display = 'flex';
  generateBtn.disabled = true;
  startTimer();

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: selectedStudents,
        scripture: scripture,
        title: title,
        duration: duration,
        model: model
      })
    });

    if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate play');
    }

    // Read streaming response line by line
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let resultData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === 'status') {
            loadingStatus.textContent = event.detail;
          } else if (event.type === 'error') {
            throw new Error(event.error);
          } else if (event.type === 'result') {
            resultData = event;
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }

    if (!resultData) {
      throw new Error('No result received from server');
    }

    playDisplay.innerHTML = resultData.html;
    currentMarkdown = resultData.markdown;
    currentTitle = title || 'scripture-play';
    showOutput();

  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    stopTimer();
    loading.style.display = 'none';
    generateBtn.disabled = false;
  }
}

function downloadScript() {
  if (!currentMarkdown) return;

  const filename = currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
  const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showOutput() {
  inputSection.style.display = 'none';
  outputSection.style.display = 'block';
}

function showInput() {
  outputSection.style.display = 'none';
  inputSection.style.display = 'grid';
  document.body.classList.remove('fullscreen');
}

function toggleFullscreen() {
  document.body.classList.toggle('fullscreen');
  fullscreenBtn.textContent = document.body.classList.contains('fullscreen')
    ? 'Exit Fullscreen'
    : 'Fullscreen';
}

// State persistence
function saveState() {
  const state = {
    selectedStudents: getSelectedStudents(),
    visitors: visitors,
    title: scriptureTitle.value,
    scripture: scriptureText.value,
    duration: durationSelect.value,
    model: modelSelect.value
  };
  localStorage.setItem('scripture-play-maker-state', JSON.stringify(state));
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem('scripture-play-maker-state');
    if (saved) {
      const state = JSON.parse(saved);

      if (state.visitors) {
        visitors = state.visitors;
        renderStudentList();
      }

      if (state.selectedStudents) {
        state.selectedStudents.forEach(name => {
          const cb = document.getElementById(`student-${name}`);
          if (cb) cb.checked = true;
        });
      }

      if (state.title) scriptureTitle.value = state.title;
      if (state.scripture) scriptureText.value = state.scripture;
      if (state.duration) durationSelect.value = state.duration;
      if (state.model) modelSelect.value = state.model;
    }
  } catch (e) {
    console.error('Failed to load saved state:', e);
  }
}

function switchTab(tab, opts = {}) {
  const updateHash = opts.updateHash !== false;
  currentTab = tab;
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  inputSection.style.display = 'none';
  outputSection.style.display = 'none';
  templatesInputSection.style.display = 'none';
  librarySection.style.display = 'none';
  libraryCastSection.style.display = 'none';
  castOutputSection.style.display = 'none';
  historySection.style.display = 'none';
  historyViewSection.style.display = 'none';
  document.body.classList.remove('fullscreen');

  if (tab === 'create') {
    inputSection.style.display = 'grid';
  } else if (tab === 'templates') {
    templatesInputSection.style.display = 'grid';
  } else if (tab === 'library') {
    librarySection.style.display = 'block';
    loadTemplateLibrary();
  } else if (tab === 'history') {
    historySection.style.display = 'block';
    loadScriptHistory();
  }

  if (updateHash) {
    const targetHash = '#' + tab;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }
  }
}

// ===== Templates (pre-make) =====

async function generateTemplate() {
  const title = tplTitle.value.trim();
  const scripture = tplScripture.value.trim();
  const duration = tplDuration.value;
  const targetCastSize = tplCastSize.value;
  const model = tplModel.value;

  if (!scripture) {
    alert('Please enter scripture text');
    return;
  }

  loading.style.display = 'flex';
  tplGenerateBtn.disabled = true;
  startTimer();

  try {
    const response = await fetch('/api/templates/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scripture, duration, model, targetCastSize })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let resultData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === 'status') {
            loadingStatus.textContent = event.detail;
          } else if (event.type === 'error') {
            throw new Error(event.error);
          } else if (event.type === 'result') {
            resultData = event;
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }

    if (!resultData) throw new Error('No result received from server');

    alert(`Template saved with ${resultData.roles.length} roles. Switching to library.`);
    switchTab('library');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    stopTimer();
    loading.style.display = 'none';
    tplGenerateBtn.disabled = false;
  }
}

// ===== Library (cast pre-made) =====

async function loadTemplateLibrary() {
  try {
    const response = await fetch('/api/templates');
    const templates = await response.json();

    if (!templates.length) {
      libraryList.innerHTML = '<p class="history-empty">No templates yet. Pre-make one from the Pre-make Play tab.</p>';
      return;
    }

    libraryList.innerHTML = templates.map(t => {
      const date = new Date(t.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const roleCount = Array.isArray(t.roles) ? t.roles.length : 0;
      return `
        <div class="library-card">
          <div class="library-card-content" data-id="${escapeHtml(t.id)}">
            <h3>${escapeHtml(t.title)}</h3>
            <div class="library-meta">
              <span>${dateStr}</span>
              <span>${escapeHtml(String(t.duration))} min</span>
              <span>${roleCount} roles</span>
            </div>
          </div>
          <button class="library-delete-btn" data-delete-id="${escapeHtml(t.id)}" title="Delete template">&#x2715;</button>
        </div>
      `;
    }).join('');

    libraryList.querySelectorAll('.library-card-content').forEach(el => {
      el.addEventListener('click', () => openTemplateForCasting(el.dataset.id));
    });
    libraryList.querySelectorAll('.library-delete-btn').forEach(el => {
      el.addEventListener('click', (e) => deleteTemplate(el.dataset.deleteId, e));
    });
  } catch (error) {
    libraryList.innerHTML = '<p class="history-empty">Failed to load templates.</p>';
  }
}

async function deleteTemplate(id, event) {
  event.stopPropagation();
  if (!confirm('Delete this template? This cannot be undone.')) return;
  try {
    const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Delete failed');
    loadTemplateLibrary();
  } catch (e) {
    alert('Failed to delete template');
  }
}

async function openTemplateForCasting(id) {
  try {
    const response = await fetch(`/api/templates/${id}`);
    if (!response.ok) throw new Error('Not found');
    selectedTemplate = await response.json();
  } catch (e) {
    alert('Failed to load template');
    return;
  }

  castTemplateTitle.textContent = selectedTemplate.title;
  const roles = selectedTemplate.roles || [];
  castTemplateMeta.innerHTML = `
    <span>${roles.length} roles</span>
    <span>${escapeHtml(String(selectedTemplate.duration))} min</span>
  `;
  castTemplateRoles.innerHTML = roles.map(r => `
    <div class="template-role-item">
      <span class="role-name">${escapeHtml(r.name)}</span>
    </div>
  `).join('');

  renderCastStudentList();

  librarySection.style.display = 'none';
  libraryCastSection.style.display = 'grid';
}

function renderCastStudentList() {
  castStudentList.innerHTML = '';
  studentsWithGender.forEach(s => {
    const div = document.createElement('div');
    div.className = 'student-item';
    div.innerHTML = `
      <input type="checkbox" id="cast-student-${s.name}" value="${escapeHtml(s.name)}" data-gender="${s.gender}">
      <label for="cast-student-${s.name}">${escapeHtml(s.name)}</label>
    `;
    castStudentList.appendChild(div);
  });
  castVisitors.forEach(v => {
    const div = document.createElement('div');
    div.className = 'student-item visitor';
    div.innerHTML = `
      <input type="checkbox" id="cast-student-${v.name}" value="${escapeHtml(v.name)}" data-gender="${v.gender}" checked>
      <label for="cast-student-${v.name}">${escapeHtml(v.name)} (${v.gender === 'F' ? 'F' : 'M'} visitor)</label>
    `;
    castStudentList.appendChild(div);
  });
}

function addCastVisitor() {
  const name = castVisitorInput.value.trim();
  if (!name) return;
  if (students.includes(name) || castVisitors.find(v => v.name === name)) return;
  const isFemale = confirm(`Is ${name} female? Click OK for female, Cancel for male/other.`);
  castVisitors.push({ name, gender: isFemale ? 'F' : 'M' });
  renderCastStudentList();
  castVisitorInput.value = '';
}

function getCastSelectedStudents() {
  const checkboxes = castStudentList.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => ({
    name: cb.value,
    gender: cb.dataset.gender || 'M'
  }));
}

async function castSelectedTemplate() {
  if (!selectedTemplate) return;
  const present = getCastSelectedStudents();
  if (present.length === 0) {
    alert('Pick at least one student');
    return;
  }

  loading.style.display = 'flex';
  loadingStatus.textContent = 'Assigning roles...';
  castGoBtn.disabled = true;
  startTimer();

  try {
    const response = await fetch(`/api/templates/${selectedTemplate.id}/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: present })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Casting failed');

    currentCastMarkdown = data.markdown;
    currentCastTitle = data.title || selectedTemplate.title;
    castPlayDisplay.innerHTML = data.html;

    if (data.warnings && data.warnings.length > 0) {
      castWarnings.style.display = 'block';
      castWarnings.innerHTML = data.warnings.map(w => `<div>${escapeHtml(w)}</div>`).join('');
    } else {
      castWarnings.style.display = 'none';
      castWarnings.innerHTML = '';
    }

    libraryCastSection.style.display = 'none';
    castOutputSection.style.display = 'block';
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    stopTimer();
    loading.style.display = 'none';
    castGoBtn.disabled = false;
  }
}

async function loadScriptHistory() {
  try {
    const response = await fetch('/api/scripts');
    const scripts = await response.json();

    if (scripts.length === 0) {
      historyList.innerHTML = '<p class="history-empty">No scripts yet. Generate your first play to see it here.</p>';
      return;
    }

    historyList.innerHTML = scripts.map(script => {
      const date = new Date(script.date);
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit'
      });
      const studentCount = script.students ? script.students.length : 0;
      const safeId = escapeHtml(script.id);
      const safeTitle = escapeHtml(script.title);

      return `
        <div class="history-card" data-id="${safeId}">
          <div class="history-card-content" data-script-id="${safeId}">
            <h3>${safeTitle}</h3>
            <div class="history-meta">
              <span>${dateStr} at ${timeStr}</span>
              <span>${escapeHtml(String(script.duration))} min</span>
              <span>${studentCount} students</span>
            </div>
          </div>
          <button class="history-delete-btn" data-delete-id="${safeId}" title="Delete script">&#x2715;</button>
        </div>
      `;
    }).join('');

    historyList.querySelectorAll('.history-card-content').forEach(el => {
      el.addEventListener('click', () => viewScript(el.dataset.scriptId));
    });
    historyList.querySelectorAll('.history-delete-btn').forEach(el => {
      el.addEventListener('click', (e) => deleteScript(el.dataset.deleteId, e));
    });
  } catch (error) {
    historyList.innerHTML = '<p class="history-empty">Failed to load script history.</p>';
  }
}

async function viewScript(id) {
  try {
    const response = await fetch(`/api/scripts/${id}`);
    const script = await response.json();

    viewingHistoryMarkdown = script.markdown;
    viewingHistoryTitle = script.title;
    historyPlayDisplay.innerHTML = script.html;

    historySection.style.display = 'none';
    historyViewSection.style.display = 'block';
  } catch (error) {
    alert('Failed to load script');
  }
}

async function deleteScript(id, event) {
  event.stopPropagation();
  if (!confirm('Delete this script? This cannot be undone.')) return;

  try {
    const response = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Delete failed');
    }
    loadScriptHistory();
  } catch (error) {
    alert('Failed to delete script');
  }
}

// Initialize on load
init();
