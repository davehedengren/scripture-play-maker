# Scripture Play Maker

## Overview
A web application that generates scripture-based plays for classroom settings using AI (Anthropic Claude or OpenAI GPT models). Teachers can select students, input scripture passages, and generate engaging plays with assigned roles.

## Project Architecture
- **Backend**: Node.js with Express server (`server.js`)
- **Frontend**: Static HTML/CSS/JS served from `/public`
- **AI Integration**: Anthropic Claude and OpenAI GPT for play generation
- **Data Storage**: 
  - PostgreSQL database for script history (persists across restarts/deploys)
  - Local JSON file for role history (`data/role-history.json`)

## Key Files
- `server.js` - Express server with API endpoints and database init
- `public/index.html` - Main HTML page with tabbed interface
- `public/app.js` - Frontend JavaScript
- `public/styles.css` - Styling
- `data/role-history.json` - Stores casting history

## Database
- PostgreSQL with a `scripts` table storing generated plays
- Table columns: id, created_at, title, duration, model, students (JSONB), casting (JSONB), markdown, html

## API Endpoints
- `GET /api/role-history` - Retrieve casting history
- `GET /api/scripts` - List all saved scripts (without full content)
- `GET /api/scripts/:id` - Get a single script with full content
- `DELETE /api/scripts/:id` - Delete a script
- `POST /api/generate` - Generate a new play

## Environment Variables
- `ANTHROPIC_API_KEY` - Required for Claude models
- `OPENAI_API_KEY` - Required for GPT models
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)

## Running the App
```bash
npm install
npm start
```

The server runs on port 5000 bound to 0.0.0.0.

## Recent Changes
- February 13, 2026: Moved script history storage from JSON file to PostgreSQL for persistence
- February 13, 2026: Added "Past Scripts" tab to browse, view, download, and delete previously generated plays
- February 13, 2026: Updated default model to Claude Opus 4.6
- February 1, 2026: Initial setup for Replit environment, configured to run on port 5000 with 0.0.0.0 binding
