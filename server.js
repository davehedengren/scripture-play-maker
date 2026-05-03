import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const anthropic = new Anthropic({
  timeout: 5 * 60 * 1000,
});

const openai = new OpenAI({
  timeout: 5 * 60 * 1000,
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const ROLE_HISTORY_PATH = path.join(__dirname, 'data', 'role-history.json');
const STUDENTS_PATH = path.join(__dirname, 'data', 'students.json');
const MAX_HISTORY_ENTRIES = 10;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        title TEXT NOT NULL,
        duration TEXT,
        model TEXT,
        students JSONB,
        casting JSONB,
        markdown TEXT,
        html TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS play_templates (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        title TEXT NOT NULL,
        scripture_ref TEXT,
        scripture_text TEXT,
        duration TEXT,
        model TEXT,
        target_cast_size INTEGER,
        roles JSONB,
        markdown TEXT,
        html TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS casting_events (
        id SERIAL PRIMARY KEY,
        script_id TEXT,
        template_id TEXT,
        student_name TEXT NOT NULL,
        role_name TEXT NOT NULL,
        word_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS casting_events_student_idx
      ON casting_events (student_name)
    `);
  } finally {
    client.release();
  }
}

function countWords(s) {
  return s.split(/\s+/).filter(w => w.length > 0).length;
}

function normalizeRoleName(raw) {
  return raw.trim().replace(/[:.\s\-—–]+$/, '').trim();
}

// Parse role definitions from a template. Lenient about whether the LLM put the
// colon inside or outside the bold markers, and whether it used a leading dash.
function parseTemplateRoles(markdown) {
  const roles = [];
  const seen = new Set();

  // Pass 1: roles with explicit (F) or (M) gender tag — handles cast list lines.
  const taggedRegex = /^(?:-\s*)?\*\*([^*\n]+?):?\*\*\s*\(([FfMm])\)/gm;
  let m;
  while ((m = taggedRegex.exec(markdown)) !== null) {
    const name = normalizeRoleName(m[1]);
    const tag = m[2].toUpperCase();
    if (!name || name.includes('(')) continue;
    if (!seen.has(name)) {
      seen.add(name);
      roles.push({ name, gender: tag === 'F' ? 'F' : 'ANY' });
    }
  }

  // Pass 2: every other speaking role found at the start of a line.
  const anyRoleRegex = /^(?:-\s*)?\*\*([^*\n]+?):?\*\*/gm;
  while ((m = anyRoleRegex.exec(markdown)) !== null) {
    const name = normalizeRoleName(m[1]);
    if (!name || name.includes('(')) continue;
    if (!seen.has(name)) {
      seen.add(name);
      roles.push({ name, gender: 'ANY' });
    }
  }

  // Word counts per role (count from dialogue lines only — those have content after).
  const wordCounts = {};
  const dialogueRegex = /^(?:-\s*)?\*\*([^*\n]+?)(?:\s*\([^)]*\))?:?\*\*:?\s*(.+)$/gm;
  while ((m = dialogueRegex.exec(markdown)) !== null) {
    const name = normalizeRoleName(m[1]);
    wordCounts[name] = (wordCounts[name] || 0) + countWords(m[2]);
  }

  return roles.map(r => ({ ...r, wordCount: wordCounts[r.name] || 0 }));
}

// Parse a cast script (with student names baked in) for per-student word counts.
// Line format: "**ROLE (Student Name):** dialogue..."
function parseCastScriptWordCounts(markdown) {
  const wordsByStudent = {};
  const studentByRole = {};
  const lineRegex = /^\*\*([^*]+?)\s*\(([^)]+)\):\*\*\s*(.+)$/gm;
  let m;
  while ((m = lineRegex.exec(markdown)) !== null) {
    const role = m[1].trim();
    const student = m[2].trim();
    const words = countWords(m[3]);
    wordsByStudent[student] = (wordsByStudent[student] || 0) + words;
    if (studentByRole[role] === undefined) studentByRole[role] = student;
  }
  return { wordsByStudent, studentByRole };
}

async function getLifetimeWordsByStudent() {
  const result = await pool.query(
    'SELECT student_name, COALESCE(SUM(word_count), 0)::int AS total FROM casting_events GROUP BY student_name'
  );
  const map = {};
  result.rows.forEach(r => { map[r.student_name] = r.total; });
  return map;
}

async function recordCastingEvents({ scriptId, templateId, casting, wordsByRole }) {
  const entries = Object.entries(casting);
  if (entries.length === 0) return;
  const values = [];
  const params = [];
  entries.forEach(([role, student], i) => {
    const base = i * 5;
    params.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
    values.push(scriptId || null, templateId || null, student, role, wordsByRole[role] || 0);
  });
  await pool.query(
    `INSERT INTO casting_events (script_id, template_id, student_name, role_name, word_count)
     VALUES ${params.join(', ')}`,
    values
  );
}

// Casting: every role gets an actor. Students with fewer lifetime words and
// fewer roles in this play get priority for the biggest remaining role.
// Students may be assigned multiple roles when there are more roles than students.
function castRoles(roles, presentStudents, lifetimeWords) {
  const warnings = [];

  const femaleRoles = roles.filter(r => r.gender === 'F').sort((a, b) => b.wordCount - a.wordCount);
  const anyRoles = roles.filter(r => r.gender !== 'F').sort((a, b) => b.wordCount - a.wordCount);
  const femaleStudents = presentStudents.filter(s => s.gender === 'F');

  if (femaleStudents.length === 0 && femaleRoles.length > 0) {
    return { error: `This template has ${femaleRoles.length} female-only role(s) but no female actors are present.` };
  }

  const casting = {};
  const rolesPerStudent = {};
  presentStudents.forEach(s => { rolesPerStudent[s.name] = 0; });

  function pickStudent(eligible) {
    return [...eligible].sort((a, b) => {
      const ra = rolesPerStudent[a.name] || 0;
      const rb = rolesPerStudent[b.name] || 0;
      if (ra !== rb) return ra - rb;
      const wa = (lifetimeWords[a.name] || 0) + Math.random() * 0.5;
      const wb = (lifetimeWords[b.name] || 0) + Math.random() * 0.5;
      return wa - wb;
    })[0];
  }

  for (const role of femaleRoles) {
    const student = pickStudent(femaleStudents);
    casting[role.name] = student.name;
    rolesPerStudent[student.name] = (rolesPerStudent[student.name] || 0) + 1;
  }

  for (const role of anyRoles) {
    const student = pickStudent(presentStudents);
    casting[role.name] = student.name;
    rolesPerStudent[student.name] = (rolesPerStudent[student.name] || 0) + 1;
  }

  const unused = presentStudents.filter(s => rolesPerStudent[s.name] === 0).map(s => s.name);
  if (unused.length > 0) {
    warnings.push(`No role for: ${unused.join(', ')}. Template has fewer roles than students.`);
  }

  const doubled = presentStudents
    .filter(s => rolesPerStudent[s.name] > 1)
    .map(s => `${s.name} (${rolesPerStudent[s.name]} roles)`);
  if (doubled.length > 0) {
    warnings.push(`Doubling up: ${doubled.join(', ')}`);
  }

  return { casting, warnings };
}

// Rewrite every line whose header matches a known role to "**ROLE (Student):**".
// Tolerates **ROLE**, **ROLE:**, **ROLE**:, optional leading "- ", optional (F)/(M) tag.
function applyCastingToMarkdown(markdown, casting) {
  let out = markdown;
  const roleNames = Object.keys(casting).sort((a, b) => b.length - a.length);
  for (const role of roleNames) {
    const student = casting[role];
    const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(`^(-\\s*)?\\*\\*${escaped}:?\\*\\*(?::|(?:\\s+\\([^)]+\\)\\s*:?))?`, 'gm'),
      (_match, dash) => `${dash || ''}**${role} (${student}):**`
    );
  }
  return out;
}

async function loadStudents() {
  try {
    const data = await fs.readFile(STUDENTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveStudents(students) {
  await fs.mkdir(path.dirname(STUDENTS_PATH), { recursive: true });
  await fs.writeFile(STUDENTS_PATH, JSON.stringify(students, null, 2));
}

async function loadRoleHistory() {
  try {
    const data = await fs.readFile(ROLE_HISTORY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveRoleHistory(history) {
  await fs.mkdir(path.dirname(ROLE_HISTORY_PATH), { recursive: true });
  await fs.writeFile(ROLE_HISTORY_PATH, JSON.stringify(history, null, 2));
}

function analyzeRoleHistory(history, students) {
  const roleCounts = {};
  students.forEach(s => roleCounts[s] = 0);

  history.forEach(entry => {
    Object.keys(entry.casting || {}).forEach(student => {
      if (roleCounts[student] !== undefined) {
        roleCounts[student]++;
      }
    });
  });

  const sorted = students.sort((a, b) => roleCounts[a] - roleCounts[b]);
  const prioritized = sorted.filter(s => roleCounts[s] < Math.max(...Object.values(roleCounts)));

  return { roleCounts, prioritized };
}

app.get('/api/role-history', async (req, res) => {
  try {
    const history = await loadRoleHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load role history' });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await loadStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load students' });
  }
});

app.put('/api/students', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Students must be an array' });
    }
    const cleaned = students
      .map(s => typeof s === 'string' ? { name: s.trim(), gender: 'M' } : { name: (s.name || '').trim(), gender: s.gender || 'M' })
      .filter(s => s.name.length > 0);
    await saveStudents(cleaned);
    res.json(cleaned);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save students' });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, created_at as date, title, duration, model, students, casting FROM scripts ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading scripts:', error);
    res.status(500).json({ error: 'Failed to load script history' });
  }
});

app.get('/api/scripts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, created_at as date, title, duration, model, students, casting, markdown, html FROM scripts WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error loading script:', error);
    res.status(500).json({ error: 'Failed to load script' });
  }
});

app.delete('/api/scripts/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM scripts WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

app.post('/api/generate', async (req, res) => {
  const { students, scripture, title, duration, model } = req.body;

  if (!students || students.length === 0) {
    return res.status(400).json({ error: 'Please select at least one student' });
  }

  if (!scripture || scripture.trim() === '') {
    return res.status(400).json({ error: 'Please provide scripture text' });
  }

  // Set up streaming response
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  function sendStatus(status, detail) {
    res.write(JSON.stringify({ type: 'status', status, detail }) + '\n');
  }

  try {
    sendStatus('preparing', 'Loading role history...');
    const history = await loadRoleHistory();
    const { prioritized } = analyzeRoleHistory(history, students);

    // Build gender lookup from stored student data
    const storedStudents = await loadStudents();
    const genderMap = {};
    storedStudents.forEach(s => {
      if (typeof s === 'object') genderMap[s.name] = s.gender;
    });

    // Shuffle students randomly using Fisher-Yates, with prioritized students first
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Move prioritized students to the front so they get roles first
    if (prioritized.length > 0) {
      const prioritySet = new Set(prioritized);
      const front = shuffled.filter(s => prioritySet.has(s));
      const rest = shuffled.filter(s => !prioritySet.has(s));
      shuffled.length = 0;
      shuffled.push(...front, ...rest);
    }

    const numberedNames = shuffled.map((name, i) => {
      const gender = genderMap[name] || 'M';
      return `${i + 1}. ${name} (${gender})`;
    }).join('\n');
    const selectedGenre = 'adventure';
    const playDuration = duration || '20';

    const wordsPerMinute = 130;
    const targetWordCount = parseInt(playDuration) * wordsPerMinute;
    const maxWordCount = Math.round(targetWordCount * 1.15);

    const userPrompt = `Write a ${playDuration} minute play about a story from the LDS scripture. At a reading pace of ${wordsPerMinute} words per minute, the ENTIRE play (including the playbill, stage directions, and all dialogue) must be between ${targetWordCount} and ${maxWordCount} words. This is a hard limit — do not exceed ${maxWordCount} words under any circumstances.

The actors will be reading the play while seated. All action will need to be described by a narrator or in the characters dialogue.

Assign characters to actors in the numbered order below. Each actor is marked (M) for male or (F) for female. Follow these casting rules:
- For female characters: ONLY assign an actor marked (F). If the next actor in the list is (M), skip them and use the next (F) actor.
- For male or gender-neutral characters (narrator, townspeople, animals, angels, messengers, etc.): assign any actor, regardless of (M) or (F).
- Every actor must get exactly one role. No actor may be skipped entirely — if you run out of gendered roles, create additional gender-neutral parts (extra townspeople, messengers, chorus members, etc.) so everyone is included.

${numberedNames}

The story is from ${title || 'the following scripture passage'}: ${scripture}

The genre of the play should be: ${selectedGenre}

Begin the play with a playbill showing which name will play each part. IMPORTANT: On EVERY line of dialogue and EVERY stage direction, always show both the character name AND the student's real name together, for example: **MOSES (Olin H):** "Let my people go!" — never write just the character name alone. The students are reading from the script and need to see their own name to know when it's their turn.

The play should not make references to coffee, tea, alcohol, or tobacco.

Remember: brevity is essential. Keep the play tight and punchy. Cut unnecessary dialogue, combine scenes where possible, and focus on the key moments of the story. The total word count MUST stay under ${maxWordCount} words.`;

    const systemPrompt = `You are a youth minister who worked as a professional improv comedian for 7 years. Your job is to write funny, cheesy retellings of scriptures from the Church of Jesus Christ of Latter-day Saints that engage teenagers and help teach them the gospel. You have a gift for making ancient stories hilarious and relatable while preserving their spiritual meaning. Use humor, anachronisms, pop culture references, and witty dialogue to keep teens laughing and engaged.

CRITICAL LENGTH CONSTRAINT: You must write concisely. The play must fit within the specified word count. Prioritize punchy, quick-hit humor over long monologues. Every line should earn its place — cut anything that doesn't advance the story or land a joke. Shorter scenes with sharp dialogue are better than sprawling ones.`;

    let playText;
    const selectedModel = model || 'claude-opus-4-6';

    sendStatus('generating', `Writing play with ${selectedModel}...`);

    if (selectedModel.startsWith('gpt')) {
      const response = await openai.chat.completions.create({
        model: selectedModel,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      playText = response.choices[0].message.content;
    } else {
      const response = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });
      playText = response.content[0].text;
    }

    let wordCount = playText.split(/\s+/).filter(w => w.length > 0).length;
    let estimatedMinutes = Math.round(wordCount / wordsPerMinute * 10) / 10;
    console.log(`Initial generation: ${wordCount} words, ~${estimatedMinutes} min (target: ${playDuration} min, ${targetWordCount}-${maxWordCount} words)`);

    sendStatus('word_check', `Play generated: ${wordCount} words (~${estimatedMinutes} min). Target: ${targetWordCount}-${maxWordCount} words.`);

    // If the play is too long, condense it with a fast model
    if (wordCount > maxWordCount) {
      sendStatus('condensing', `Play is ${wordCount - maxWordCount} words over limit. Condensing with Sonnet 4.6...`);

      const condensePrompt = `The following play is ${wordCount} words long, but it needs to be ${targetWordCount}-${maxWordCount} words (a ${playDuration} minute play at ${wordsPerMinute} words per minute). That means you need to cut roughly ${wordCount - targetWordCount} words.

Rewrite the play to fit within ${maxWordCount} words. Rules:
- Keep the same characters, actors, and casting (do not change who plays whom)
- Keep the playbill at the top
- EVERY line of dialogue MUST show both character name AND student name, e.g. **MOSES (Olin H):** — never drop the student name
- Preserve the best jokes and the key story beats
- Cut or shorten long monologues, redundant dialogue, and unnecessary scenes
- Combine scenes where possible
- Keep the same tone and style

Here is the play to condense:

${playText}`;

      const condenseResponse = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        system: 'You are an expert script editor. Your job is to tighten plays to a target word count while preserving their humor, story, and character assignments. Return ONLY the condensed play with no commentary.',
        messages: [
          { role: 'user', content: condensePrompt }
        ]
      });
      playText = condenseResponse.content[0].text;

      wordCount = playText.split(/\s+/).filter(w => w.length > 0).length;
      estimatedMinutes = Math.round(wordCount / wordsPerMinute * 10) / 10;
      console.log(`After condensing: ${wordCount} words, ~${estimatedMinutes} min`);

      sendStatus('condensed', `Condensed to ${wordCount} words (~${estimatedMinutes} min).`);
    } else {
      sendStatus('length_ok', `Word count is within target. No condensing needed.`);
    }

    sendStatus('saving', 'Saving play...');

    const playHtml = marked(playText);

    const casting = {};
    const castMatch = playText.match(/CAST LIST[\s\S]*?(?=\n\n[^*]|\n\n---|\n\n#)/i);
    if (castMatch) {
      const castLines = castMatch[0].match(/\*\*(\w+(?:\s+\w+)?)\*\*\s*→\s*(.+)/g);
      if (castLines) {
        castLines.forEach(line => {
          const match = line.match(/\*\*(.+?)\*\*\s*→\s*(.+)/);
          if (match) {
            casting[match[1].trim()] = match[2].trim();
          }
        });
      }
    }

    const newEntry = {
      date: new Date().toISOString(),
      title: title || 'Untitled',
      casting
    };

    history.unshift(newEntry);
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }
    await saveRoleHistory(history);

    const scriptId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    await pool.query(
      `INSERT INTO scripts (id, title, duration, model, students, casting, markdown, html)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)`,
      [scriptId, title || 'Untitled', playDuration, selectedModel, JSON.stringify(students), JSON.stringify(casting), playText, playHtml]
    );

    const { wordsByStudent, studentByRole } = parseCastScriptWordCounts(playText);
    const wordsByRole = {};
    Object.entries(studentByRole).forEach(([role, student]) => {
      wordsByRole[role] = wordsByStudent[student] || 0;
    });
    await recordCastingEvents({
      scriptId,
      templateId: null,
      casting: studentByRole,
      wordsByRole
    });

    // Send final result
    res.write(JSON.stringify({
      type: 'result',
      id: scriptId,
      markdown: playText,
      html: playHtml,
      casting,
      wordCount,
      estimatedMinutes,
      targetDuration: parseInt(playDuration)
    }) + '\n');
    res.end();

  } catch (error) {
    console.error('Error generating play:', error);
    res.write(JSON.stringify({ type: 'error', error: 'Failed to generate play: ' + error.message }) + '\n');
    res.end();
  }
});

app.post('/api/templates/generate', async (req, res) => {
  const { scripture, title, duration, model, targetCastSize } = req.body;

  if (!scripture || scripture.trim() === '') {
    return res.status(400).json({ error: 'Please provide scripture text' });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  function sendStatus(status, detail) {
    res.write(JSON.stringify({ type: 'status', status, detail }) + '\n');
  }

  try {
    const playDuration = duration || '20';
    const castSize = parseInt(targetCastSize) || 15;
    const wordsPerMinute = 130;
    const targetWordCount = parseInt(playDuration) * wordsPerMinute;
    const maxWordCount = Math.round(targetWordCount * 1.15);
    const selectedModel = model || 'claude-opus-4-6';

    const userPrompt = `Write a ${playDuration} minute play about a story from the LDS scripture. This is a TEMPLATE — actors will be cast later, so DO NOT include any actor or student names anywhere. Use only character (role) names.

The actors will be reading the play while seated. All action will need to be described by a narrator or in the characters dialogue.

REQUIRED FORMAT (follow exactly):

1. Begin with the title as a heading, then a "## Cast List" section. Each role gets ONE line in this exact format, no exceptions:
   - **ROLE NAME** (F): brief description
   - **ROLE NAME**: brief description
   The "(F)" tag means the role MUST be played by a female actor (e.g., Mary, Eve, Miriam, Esther). Roles without "(F)" can be played by any actor regardless of gender. Use "(F)" ONLY for roles that are explicitly female in the scripture.
   CRITICAL: the colon MUST go OUTSIDE the closing asterisks. Write \`**MOSES**:\` — never \`**MOSES:**\` — in the cast list.

2. After the cast list, write the play. EVERY line of dialogue MUST start with **ROLE NAME:** followed by the line. Example:
   **MOSES:** Let my people go!
   **NARRATOR:** And so the journey began.
   Stage directions go in *italics* on their own paragraph. NEVER include actor or student names — only role names.

3. Aim for approximately ${castSize} distinct speaking roles. Use a narrator and small parts (messengers, townspeople, etc.) to reach the target count. The role count is approximate — anywhere from ${Math.max(1, castSize - 3)} to ${castSize + 3} is fine.

4. The total word count (cast list + dialogue + stage directions) MUST be between ${targetWordCount} and ${maxWordCount} words. This is a hard limit.

The story is from ${title || 'the following scripture passage'}: ${scripture}

The genre of the play should be: adventure

The play should not make references to coffee, tea, alcohol, or tobacco.

Remember: brevity is essential. Keep the play tight and punchy. Cut unnecessary dialogue, combine scenes where possible, and focus on the key moments of the story.`;

    const systemPrompt = `You are a youth minister who worked as a professional improv comedian for 7 years. Your job is to write funny, cheesy retellings of scriptures from the Church of Jesus Christ of Latter-day Saints that engage teenagers and help teach them the gospel. You have a gift for making ancient stories hilarious and relatable while preserving their spiritual meaning. Use humor, anachronisms, pop culture references, and witty dialogue to keep teens laughing and engaged.

CRITICAL FORMAT CONSTRAINT: This is a reusable template. Never include any actor, student, or person's real name. Use only role/character names throughout.

CRITICAL LENGTH CONSTRAINT: You must write concisely. The play must fit within the specified word count. Prioritize punchy, quick-hit humor over long monologues.`;

    sendStatus('generating', `Writing template with ${selectedModel}...`);

    let playText;
    if (selectedModel.startsWith('gpt')) {
      const response = await openai.chat.completions.create({
        model: selectedModel,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      playText = response.choices[0].message.content;
    } else {
      const response = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      playText = response.content[0].text;
    }

    let wordCount = countWords(playText);
    sendStatus('word_check', `Template generated: ${wordCount} words. Target: ${targetWordCount}-${maxWordCount}.`);

    if (wordCount > maxWordCount) {
      sendStatus('condensing', `Template is ${wordCount - maxWordCount} words over limit. Condensing...`);
      const condensePrompt = `The following play template is ${wordCount} words long, but it needs to be ${targetWordCount}-${maxWordCount} words.

Rewrite the play to fit within ${maxWordCount} words. Rules:
- Keep the same characters and the "## Cast List" section with the same role names and (F) gender tags
- EVERY line of dialogue MUST keep the **ROLE NAME:** prefix
- NEVER add actor or student names — only role names
- Preserve the best jokes and key story beats
- Cut or shorten long monologues, redundant dialogue, and unnecessary scenes

Here is the play to condense:

${playText}`;

      const condenseResponse = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        system: 'You are an expert script editor. Tighten plays to a target word count while preserving humor, story, and the cast list format. Return ONLY the condensed play with no commentary.',
        messages: [{ role: 'user', content: condensePrompt }]
      });
      playText = condenseResponse.content[0].text;
      wordCount = countWords(playText);
      sendStatus('condensed', `Condensed to ${wordCount} words.`);
    }

    sendStatus('saving', 'Parsing roles and saving template...');

    const roles = parseTemplateRoles(playText);
    if (roles.length === 0) {
      throw new Error('Could not parse any roles from generated template. The model did not follow the cast list format.');
    }

    const playHtml = marked(playText);
    const templateId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    await pool.query(
      `INSERT INTO play_templates (id, title, scripture_ref, scripture_text, duration, model, target_cast_size, roles, markdown, html)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
      [templateId, title || 'Untitled', title || null, scripture, playDuration, selectedModel, castSize, JSON.stringify(roles), playText, playHtml]
    );

    res.write(JSON.stringify({
      type: 'result',
      id: templateId,
      title: title || 'Untitled',
      roles,
      markdown: playText,
      html: playHtml,
      wordCount
    }) + '\n');
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.write(JSON.stringify({ type: 'error', error: 'Failed to generate template: ' + error.message }) + '\n');
    res.end();
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, created_at as date, title, duration, model, target_cast_size, roles FROM play_templates ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading templates:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

app.get('/api/templates/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, created_at as date, title, scripture_ref, scripture_text, duration, model, target_cast_size, roles, markdown, html FROM play_templates WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM play_templates WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

app.post('/api/templates/:id/cast', async (req, res) => {
  try {
    const { students: presentStudents } = req.body;
    if (!Array.isArray(presentStudents) || presentStudents.length === 0) {
      return res.status(400).json({ error: 'Please select at least one student' });
    }

    const tplResult = await pool.query(
      'SELECT id, title, duration, model, roles, markdown FROM play_templates WHERE id = $1',
      [req.params.id]
    );
    if (tplResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const template = tplResult.rows[0];

    const storedStudents = await loadStudents();
    const genderMap = {};
    storedStudents.forEach(s => {
      if (typeof s === 'object') genderMap[s.name] = s.gender;
    });

    const presentWithGender = presentStudents.map(s => {
      if (typeof s === 'object') return { name: s.name, gender: s.gender || genderMap[s.name] || 'M' };
      return { name: s, gender: genderMap[s] || 'M' };
    });

    const lifetimeWords = await getLifetimeWordsByStudent();
    const cleanedRoles = (template.roles || []).map(r => ({
      ...r,
      name: normalizeRoleName(r.name || '')
    })).filter(r => r.name);
    const result = castRoles(cleanedRoles, presentWithGender, lifetimeWords);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const { casting, warnings } = result;
    const castMarkdown = applyCastingToMarkdown(template.markdown, casting);
    const castHtml = marked(castMarkdown);

    const wordsByRole = {};
    cleanedRoles.forEach(r => { wordsByRole[r.name] = r.wordCount || 0; });

    const scriptId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const studentNames = presentWithGender.map(s => s.name);

    await pool.query(
      `INSERT INTO scripts (id, title, duration, model, students, casting, markdown, html)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)`,
      [scriptId, template.title, template.duration, template.model, JSON.stringify(studentNames), JSON.stringify(casting), castMarkdown, castHtml]
    );

    await recordCastingEvents({
      scriptId,
      templateId: template.id,
      casting,
      wordsByRole
    });

    res.json({
      id: scriptId,
      templateId: template.id,
      title: template.title,
      casting,
      warnings: warnings || [],
      markdown: castMarkdown,
      html: castHtml
    });
  } catch (error) {
    console.error('Error casting template:', error);
    res.status(500).json({ error: 'Failed to cast template: ' + error.message });
  }
});

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scripture Play Maker running at http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
