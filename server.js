import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const anthropic = new Anthropic({
  timeout: 5 * 60 * 1000, // 5 minutes
});

const openai = new OpenAI({
  timeout: 5 * 60 * 1000, // 5 minutes
});

const ROLE_HISTORY_PATH = path.join(__dirname, 'data', 'role-history.json');
const MAX_HISTORY_ENTRIES = 10;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.post('/api/generate', async (req, res) => {
  const { students, scripture, title, duration, model } = req.body;

  if (!students || students.length === 0) {
    return res.status(400).json({ error: 'Please select at least one student' });
  }

  if (!scripture || scripture.trim() === '') {
    return res.status(400).json({ error: 'Please provide scripture text' });
  }

  try {
    const history = await loadRoleHistory();
    const { prioritized } = analyzeRoleHistory(history, students);

    const priorityNote = prioritized.length > 0
      ? ` Prioritize giving roles to these students who haven't had roles recently: ${prioritized.join(', ')}.`
      : '';

    const listOfNames = students.join(', ');
    const selectedGenre = 'adventure';
    const playDuration = duration || '20';
    const studentCount = students.length;

    // Dynamic casting instruction based on student count
    let castingInstruction = '';
    if (studentCount >= 20) {
      castingInstruction = `\n\nIMPORTANT: You have ${studentCount} actors to cast. Create additional characters beyond the main scripture story - add townspeople, animals, a Greek chorus, angels, comedic sidekicks, or split narrator duties among multiple people. Be creative to ensure everyone gets a meaningful part with lines.`;
    } else if (studentCount >= 15) {
      castingInstruction = `\n\nNote: You have ${studentCount} actors. Feel free to add extra characters like townspeople, messengers, or a narrator team to give everyone a part.`;
    } else if (studentCount >= 10) {
      castingInstruction = `\n\nNote: Make sure all ${studentCount} actors get a part, adding minor characters if needed.`;
    }

    // Using the proven prompt format
    const userPrompt = `Write a ${playDuration} minute play about a story from the LDS scripture. The actors will be reading the play while seated. All action will need to be described by a narrator or in the characters dialogue.

Choose characters from the story and assign them to actors. The narrator will also be assigned from the list of actors. No name will be assigned to more than one part. The list of actors is: ${listOfNames}${priorityNote}${castingInstruction}

The story is from ${title || 'the following scripture passage'}: ${scripture}

The genre of the play should be: ${selectedGenre}

Begin the play with a playbill showing which name will play each part. In the script place the name of each actor next to the character name.

The play should not make references to coffee, tea, alcohol, or tobacco.`;

    const systemPrompt = `You are a youth minister who worked as a professional improv comedian for 7 years. Your job is to write funny, cheesy retellings of scriptures from the Church of Jesus Christ of Latter-day Saints that engage teenagers and help teach them the gospel. You have a gift for making ancient stories hilarious and relatable while preserving their spiritual meaning. Use humor, anachronisms, pop culture references, and witty dialogue to keep teens laughing and engaged.`;

    let playText;
    const selectedModel = model || 'claude-sonnet-4-5-20250929';

    if (selectedModel.startsWith('gpt')) {
      // OpenAI
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
      // Anthropic
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
    const playHtml = marked(playText);

    // Extract casting from the response
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

    // Update role history
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

    res.json({
      markdown: playText,
      html: playHtml,
      casting
    });

  } catch (error) {
    console.error('Error generating play:', error);
    res.status(500).json({ error: 'Failed to generate play: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scripture Play Maker running at http://localhost:${PORT}`);
});
