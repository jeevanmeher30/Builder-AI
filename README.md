Builder AI 🎨

A full-stack AI-powered UI builder where you design interfaces visually on a drag-and-drop canvas and generate production-ready HTML/CSS/JS code instantly.

Demo

Drag components → Customize properties → Click Generate → Get clean HTML code

Features

Drag-and-drop canvas with 6 component types (Navbar, Heading, Button, Input, Card, Image)
Real-time property editor (text, colors, size, position)
AI-powered code generation using Gemini API
One-click copy of generated HTML/CSS/JS


Tech Stack

Backend: Python, FastAPI, Gemini API

Frontend: HTML, CSS, Vanilla JS

Project Structure

Builder-AI/
├── main.py              # FastAPI entry point
├── config.py            # API config
├── requirements.txt
├── .env.example
├── routes/
│   └── generate.py      # /generate endpoint
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js

Getting Started

1. Clone the repo

bashgit clone https://github.com/jeevanmeher30/Builder-AI.git
cd Builder-AI

2. Install dependencies

bashpip install -r requirements.txt

3. Set up environment

bashcp .env.example .env
# Add your Gemini API key to .env

4. Run the server

bashuvicorn main:app --port 8000

5. Open in browser

http://localhost:8000

Environment Variables

VariableDescriptionGEMINI_API_KEYYour Gemini API key from aistudio.google.com

Deployment

Deployed on Railway. Set GEMINI_API_KEY in the Railway environment variables dashboard.
