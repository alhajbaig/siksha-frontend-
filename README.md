# 🌐 SikshaSaathi — Frontend Web Application Deployment Package

This repository contains the standalone, decoupled frontend application for **SikshaSaathi (शिक्षा साथी)** — India's premier AI-powered adaptive learning and teaching ecosystem.

---

## 📁 Repository Structure

```
frontend_deploy/
├── index.html                  # Landing page & feature showcase
├── auth.html                   # Unified student & teacher login/signup
├── student.html                # Student Command Center & Daily Learning Hub
├── student-profile.html        # 360° Learning Genome & Mastery Telemetry
├── student-mentor.html         # Real-Time AI Mentor Workspace
├── student-practice.html       # Adaptive Practice Engine & Question Bank
├── student-revision.html       # 3-Stage Revision Canvas
├── student-emergency.html      # Panic Mode Exam Prep
├── student-assessments.html    # Classroom Quizzes & Diagnostic Tests
├── student-flashcards.html     # Active Recall Flashcards
├── student-notes.html          # Interactive Markdown Notes & NCERT Indexer
├── teacher.html                # Redirect gateway to educator portal
├── teacher/                    # Complete Educator Intelligence Dashboard
│   ├── index.html              # Classroom Command Center
│   ├── students.html           # Student Roster & Live Learning Health
│   ├── assessments.html        # AI Assessment Generator & Analytics
│   ├── curriculum.html         # Syllabus & Milestone Tracker
│   ├── interventions.html      # Targeted Remediation Engine
│   ├── css/                    # Teacher dashboard styles
│   └── js/                     # Teacher dashboard logic & session guards
├── css/                        # Core design system & responsive stylesheets
├── js/                         # Production application scripts
│   ├── config.js               # Dynamic API URL resolution & environment handling
│   ├── session.js              # Token management, route guards, and auto-sync
│   ├── auth.js                 # Authentication logic with persistence
│   └── student.js              # Student dashboard telemetry & state
├── vercel.json                 # Vercel deployment configuration & routing
├── netlify.toml                # Netlify deployment manifest
├── _redirects                  # Cloudflare Pages / Netlify route redirects
└── .env.example                # Environment variables reference
```

---

## 🔗 Connecting Frontend to Your Live Backend

The frontend uses `js/config.js` to automatically resolve the backend API URL. You can connect it to your live backend (e.g. deployed on Render, Railway, or Fly.io) in any of the following ways:

### Method A: Vercel Reverse Proxy Rewrite (Recommended — Zero CORS Issues)

Edit `vercel.json` and add a rewrite destination pointing to your deployed backend URL:

```json
{
  "version": 2,
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "https://your-backend-api.onrender.com/api/:match*"
    },
    {
      "source": "/teacher",
      "destination": "/teacher/index.html"
    },
    {
      "source": "/teacher/",
      "destination": "/teacher/index.html"
    }
  ]
}
```
*Why this is the best method*: All requests to `/api/...` are proxied server-side by Vercel directly to your backend, eliminating any CORS restrictions and providing SSL out of the box!

---

### Method B: Meta Tag Configuration

Add this meta tag to the `<head>` of `index.html`, `auth.html`, `student.html`, etc.:

```html
<meta name="siksha-api-url" content="https://your-backend-api.onrender.com">
```

`js/config.js` will automatically read this meta tag and direct all API calls to your live backend.

---

### Method C: Browser Console / LocalStorage (Dynamic Testing)

Open your browser's Developer Tools (F12) on your deployed frontend and run:

```javascript
window.SIKSHA_CONFIG.setApiUrl('https://your-backend-api.onrender.com');
```

This persistently stores the backend URL in `localStorage` for quick testing.

---

## 🚀 Deployment Instructions

### 1. Deploying to Vercel (Recommended)

1. Push this `frontend_deploy` folder to a new GitHub repository (e.g., `sikshasaathi-frontend`).
2. Log into [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. **Build and Output Settings**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`
   - **Build Command**: *(Leave empty)*
   - **Output Directory**: *(Leave empty or `. / default`)*
5. (Optional) If using Method A above, update `vercel.json` with your backend URL before deploying.
6. Click **Deploy**.

---

### 2. Deploying to Netlify

1. Log into [netlify.com](https://netlify.com).
2. Click **Add new site** -> **Import an existing project** (or drag & drop the `frontend_deploy` folder).
3. **Build settings**:
   - **Base directory**: *(empty)*
   - **Build command**: *(empty)*
   - **Publish directory**: `.`
4. Click **Deploy Site**. The included `netlify.toml` and `_redirects` files automatically configure routing and caching headers.

---

### 3. Deploying to Cloudflare Pages

1. Log into your Cloudflare Dashboard and navigate to **Workers & Pages** -> **Create application** -> **Pages**.
2. Connect your Git repository.
3. Configure build settings:
   - **Framework preset**: `None`
   - **Build output directory**: `.`
4. Click **Save and Deploy**. Cloudflare Pages will recognize `_redirects` for `/teacher` routing.

---

### 4. Running Locally

You can run this static frontend locally using any lightweight HTTP server:

Using Python:
```bash
python -m http.server 3000
```

Using Node (`npx`):
```bash
npx serve -l 3000 .
```

Using VS Code / Cursor:
Install the **Live Server** extension and click **Go Live**.

When run on port 3000 or 5500, `js/config.js` automatically routes API calls to `http://localhost:8000` where your backend is running.

---

## 🔒 Security & Route Guards
- Every authenticated page (`student*.html` and `teacher/*.html`) includes `js/session.js` which verifies session tokens against the backend API.
- Non-authenticated visitors are automatically directed to `auth.html`.
- Role verification prevents students from entering the teacher portal and vice versa.
- Token refresh and fallback error-handling prevent unexpected logouts.
