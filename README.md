# Cybernova — AI-Powered Detection of Cybercrime and Online Scams

* **Project Name**: Cybernova
* **Project ID**: TRI26158
* **Track**: Open Innovation
* **Problem Statement**: AI-Powered Detection of Cybercrime and Online Scams

---

## 1. Overview
Cybernova is a full-stack, explainable cybersecurity web application that detects fraudulent SMS/WhatsApp messages, phishing URLs, spoofed emails, and UPI/online financial scams. It combines a deterministic multi-signal heuristic engine with server-side Google Gemini AI semantic analysis.

## 2. Technology Stack
* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
* **Backend**: Node.js, Express.js (`server.ts`)
* **AI & Detection Engine**: Custom Multi-Signal Heuristic Engine (`src/engine/detectionEngine.ts`) + Google Gemini API (`@google/genai` SDK on server)
* **Storage**: Local JSON file database (`data/cybernova_scans.json`) + Browser `localStorage` sync
* **Google Workspace Integration**: Google Drive API (`drive.file`) for one-click Project ZIP backup

## 3. Setup & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (.env)
cp .env.example .env
# Add your GEMINI_API_KEY inside .env

# 3. Run the full-stack server (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.
