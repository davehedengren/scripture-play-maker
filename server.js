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
  } finally {
    client.release();
  }
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
    const cleaned = students.map(s => s.trim()).filter(s => s.length > 0);
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

    const numberedNames = shuffled.map((name, i) => `${i + 1}. ${name}`).join('\n');
    const selectedGenre = 'adventure';
    const playDuration = duration || '20';

    const wordsPerMinute = 130;
    const targetWordCount = parseInt(playDuration) * wordsPerMinute;
    const maxWordCount = Math.round(targetWordCount * 1.15);

    const userPrompt = `Write a ${playDuration} minute play about a story from the LDS scripture. At a reading pace of ${wordsPerMinute} words per minute, the ENTIRE play (including the playbill, stage directions, and all dialogue) must be between ${targetWordCount} and ${maxWordCount} words. This is a hard limit — do not exceed ${maxWordCount} words under any circumstances.

The actors will be reading the play while seated. All action will need to be described by a narrator or in the characters dialogue.

Assign characters to actors in EXACTLY the numbered order below. Actor #1 gets the first role you create, actor #2 gets the second role, and so on. The narrator counts as a role. No name will be assigned to more than one part. Do not skip or reorder actors.

${numberedNames}

The story is from ${title || 'the following scripture passage'}: ${scripture}

The genre of the play should be: ${selectedGenre}

Begin the play with a playbill showing which name will play each part. In the script place the name of each actor next to the character name.

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
- Preserve the best jokes and the key story beats
- Cut or shorten long monologues, redundant dialogue, and unnecessary scenes
- Combine scenes where possible
- Keep the same tone and style

Here is the play to condense:

${playText}`;

      const condenseResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
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

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scripture Play Maker running at http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
