let students = [];
let visitors = [];

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
    students = await response.json();
  } catch (e) {
    console.error('Failed to load students:', e);
  }
  renderStudentList();
  loadSavedState();
  setupEventListeners();
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

function setupEventListeners() {
  selectAllBtn.addEventListener('click', () => {
    studentList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    saveState();
  });

  clearAllBtn.addEventListener('click', () => {
    studentList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    saveState();
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

function switchTab(tab) {
  currentTab = tab;
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  inputSection.style.display = 'none';
  outputSection.style.display = 'none';
  historySection.style.display = 'none';
  historyViewSection.style.display = 'none';
  document.body.classList.remove('fullscreen');

  if (tab === 'create') {
    inputSection.style.display = 'grid';
  } else if (tab === 'history') {
    historySection.style.display = 'block';
    loadScriptHistory();
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
