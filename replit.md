# Scripture Play Maker

## Overview
A web application that generates scripture-based plays for classroom settings using AI (Anthropic Claude or OpenAI GPT models). Teachers can select students, input scripture passages, and generate engaging plays with assigned roles.

## Project Architecture
- **Backend**: Node.js with Express server (`server.js`)
- **Frontend**: Static HTML/CSS/JS served from `/public`
- **AI Integration**: Anthropic Claude and OpenAI GPT for play generation
- **Data Storage**: Local JSON file for role history (`data/role-history.json`)

## Key Files
- `server.js` - Express server with API endpoints
- `public/index.html` - Main HTML page
- `public/app.js` - Frontend JavaScript
- `public/styles.css` - Styling
- `data/role-history.json` - Stores casting history

## API Endpoints
- `GET /api/role-history` - Retrieve casting history
- `POST /api/generate` - Generate a new play

## Environment Variables
- `ANTHROPIC_API_KEY` - Required for Claude models
- `OPENAI_API_KEY` - Required for GPT models
- `PORT` - Server port (default: 5000)

## Running the App
```bash
npm install
npm start
```

The server runs on port 5000.

## Recent Changes
- February 1, 2026: Initial setup for Replit environment, configured to run on port 5000 with 0.0.0.0 binding
