// Default student list
const DEFAULT_STUDENTS = [
  'Adrian H', 'Alex R', 'Andreas P', 'Bella F', 'Blake B', 'Charles G',
  'Cooper A', 'Ellie S', 'Emelia S', 'Emma H', 'Jacob F', 'Joel R',
  'Katelyn S', 'Lila R', 'Macy H', 'McKay S', 'Naomi S', 'Nico C',
  'Olin H', 'Olivia P', 'Rebekah M', 'Ryder D', 'Sam P', 'Spencer C', 'Trent W'
];

let students = [...DEFAULT_STUDENTS];
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

let timerInterval = null;
let currentMarkdown = '';
let currentTitle = '';

// Initialize
function init() {
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
  loadingStatus.textContent = 'Sending request to Claude...';

  timerInterval = setInterval(() => {
    seconds++;
    loadingTime.textContent = `Elapsed: ${formatTime(seconds)}`;

    // Update status messages based on time
    if (seconds === 5) {
      loadingStatus.textContent = 'Claude is reading the scripture...';
    } else if (seconds === 15) {
      loadingStatus.textContent = 'Writing the play...';
    } else if (seconds === 45) {
      loadingStatus.textContent = 'Still writing (this is a long one!)...';
    } else if (seconds === 90) {
      loadingStatus.textContent = 'Almost there...';
    } else if (seconds === 150) {
      loadingStatus.textContent = 'Taking longer than usual, but still working...';
    }
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate play');
    }

    playDisplay.innerHTML = data.html;
    currentMarkdown = data.markdown;
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

// Initialize on load
init();
